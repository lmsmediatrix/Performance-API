import { config } from "../config/common";
import employeeChecklistRepository from "../repository/employeeChecklistRepository";
import checklistTemplateRepository from "../repository/checklistTemplateRepository";
import { generatePagination } from "../utils/paginationUtils";

const employeeChecklistService = {
  assignChecklist,
  getEmployeeChecklist,
  getEmployeeChecklists,
  updateEmployeeChecklist,
  archiveEmployeeChecklist,
  searchEmployeeChecklist,
  syncTemplateItemAdded,
  syncTemplateItemUpdated,
  syncTemplateItemRemoved,
};

export default employeeChecklistService;

async function assignChecklist(data: any) {
  if (!data?.organizationId || !data?.employeeId || !data?.checklistTemplateId || !data?.assignedBy) {
    throw new Error("Invalid parameters for creating employee checklist");
  }

  const existing = await employeeChecklistRepository.findOneByEmployeeAndTemplate(
    data.organizationId,
    data.employeeId,
    data.checklistTemplateId
  );

  if (existing && !existing.isDeleted) {
    throw new Error("This employee already has an active checklist for this template");
  }

  const template = await checklistTemplateRepository.getChecklistTemplate(data.checklistTemplateId, {
    query: { organizationId: data.organizationId },
  });
  if (!template) {
    throw new Error("Checklist template not found");
  }

  const items = (template.items || []).map((item: any) =>
    mapTemplateItemToEmployeeChecklistItem(item)
  );

  const payload: any = {
    organizationId: data.organizationId,
    employeeId: data.employeeId,
    checklistTemplateId: data.checklistTemplateId,
    assignedBy: data.assignedBy,
    assignedDate: data.assignedDate,
    dueDate: data.dueDate,
    status: "assigned",
    items,
  };

  return employeeChecklistRepository.createEmployeeChecklist(payload);
}

async function getEmployeeChecklist(id: string, params: any) {
  if (!id) throw new Error("Employee checklist ID is required");
  try {
    const dbParams: any = { query: {}, options: {} };
    if (params?.populateArray) dbParams.options.populateArray = params.populateArray;
    if (params?.select) dbParams.options.select = params.select.join(" ");
    if (params?.lean !== undefined) dbParams.options.lean = params.lean;
    if (params?.organizationId) dbParams.query.organizationId = params.organizationId;

    const checklist = await employeeChecklistRepository.getEmployeeChecklist(id, dbParams);
    if (!checklist) throw new Error("Employee checklist not found");
    return checklist;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function getEmployeeChecklists(params: any) {
  if (!params) throw new Error("Invalid parameters for getting employee checklists");
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const dbParams: any = {
      query: { isDeleted: false },
      options: {
        sort: params.sort || { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
        lean: params.lean ?? true,
      },
    };

    if (params.organizationId) dbParams.query.organizationId = params.organizationId;
    if (params.employeeId) dbParams.query.employeeId = params.employeeId;
    if (params.checklistTemplateId) dbParams.query.checklistTemplateId = params.checklistTemplateId;

    const [checklists, count] = await Promise.all([
      employeeChecklistRepository.getEmployeeChecklists(dbParams),
      employeeChecklistRepository.getEmployeeChecklistsCount(dbParams.query),
    ]);
    const pagination = generatePagination(count, page, limit);
    return { checklists, pagination, count };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function updateEmployeeChecklist(data: any) {
  if (!data?._id) throw new Error("Employee checklist ID is required");
  try {
    const existing = await employeeChecklistRepository.getEmployeeChecklist(
      data._id
    );
    if (!existing) throw new Error("Employee checklist not found");

    const existingDoc =
      typeof (existing as any).toObject === "function"
        ? (existing as any).toObject()
        : existing;

    const merged = {
      ...existingDoc,
      ...data,
    };

    const recalculated = recalculateEmployeeChecklist(merged);

    const payload = {
      ...data,
      items: recalculated.items,
      overallScore: recalculated.overallScore,
      overallStatus: recalculated.overallStatus,
      status: recalculated.status,
      completedDate: recalculated.completedDate,
    };

    const updated = await employeeChecklistRepository.updateEmployeeChecklist(payload);
    if (!updated) throw new Error("Employee checklist not found");
    return updated;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function archiveEmployeeChecklist(id: string) {
  if (!id) throw new Error("Employee checklist ID is required");
  try {
    const archived = await employeeChecklistRepository.archiveEmployeeChecklist(id);
    if (!archived) throw new Error("Employee checklist not found");
    return archived;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function searchEmployeeChecklist(params: any) {
  const dbParams: any = {
    query: params?.query || {},
    options: {
      sort: params?.sort || { createdAt: -1 },
      skip: params?.skip,
      limit: params?.limit,
      lean: params?.lean ?? true,
    },
  };
  return employeeChecklistRepository.searchEmployeeChecklist(dbParams);
}

async function syncTemplateItemAdded(data: any) {
  if (!data?.organizationId || !data?.templateId || !data?.item?._id) {
    throw new Error("Invalid parameters for syncing added checklist template item");
  }

  const itemId = normalizeObjectId(data.item._id);
  const checklists = await getTemplateAssignedChecklists(
    data.organizationId,
    data.templateId
  );

  for (const checklist of checklists) {
    const checklistObject =
      typeof (checklist as any).toObject === "function"
        ? (checklist as any).toObject()
        : checklist;

    const existingItems = Array.isArray(checklistObject.items)
      ? checklistObject.items
      : [];

    const itemExists = existingItems.some(
      (item: any) => normalizeObjectId(item?.checklistItemId) === itemId
    );

    if (itemExists) {
      continue;
    }

    const nextItems = [
      ...existingItems,
      mapTemplateItemToEmployeeChecklistItem(data.item),
    ];

    await persistRecalculatedChecklist(checklist, nextItems);
  }
}

async function syncTemplateItemUpdated(data: any) {
  if (!data?.organizationId || !data?.templateId || !data?.item?._id) {
    throw new Error("Invalid parameters for syncing updated checklist template item");
  }

  const itemId = normalizeObjectId(data.item._id);
  const checklists = await getTemplateAssignedChecklists(
    data.organizationId,
    data.templateId
  );

  for (const checklist of checklists) {
    const checklistObject =
      typeof (checklist as any).toObject === "function"
        ? (checklist as any).toObject()
        : checklist;

    const existingItems = Array.isArray(checklistObject.items)
      ? checklistObject.items
      : [];

    const itemIndex = existingItems.findIndex(
      (item: any) => normalizeObjectId(item?.checklistItemId) === itemId
    );

    if (itemIndex < 0) {
      continue;
    }

    const existingItem = existingItems[itemIndex] || {};
    const templateBasedItem = mapTemplateItemToEmployeeChecklistItem(data.item);

    const nextItem = {
      ...existingItem,
      ...templateBasedItem,
      checklistItemId: data.item._id,
      actualValue: existingItem.actualValue,
      calculatedPercentage: existingItem.calculatedPercentage,
      isMet: existingItem.isMet,
      managerNotes: existingItem.managerNotes ?? "",
      overrideHistory: existingItem.overrideHistory ?? [],
    };

    const nextItems = [...existingItems];
    nextItems[itemIndex] = nextItem;

    await persistRecalculatedChecklist(checklist, nextItems);
  }
}

async function syncTemplateItemRemoved(data: any) {
  if (!data?.organizationId || !data?.templateId || !data?.itemId) {
    throw new Error("Invalid parameters for syncing removed checklist template item");
  }

  const itemId = normalizeObjectId(data.itemId);
  const checklists = await getTemplateAssignedChecklists(
    data.organizationId,
    data.templateId
  );

  for (const checklist of checklists) {
    const checklistObject =
      typeof (checklist as any).toObject === "function"
        ? (checklist as any).toObject()
        : checklist;

    const existingItems = Array.isArray(checklistObject.items)
      ? checklistObject.items
      : [];

    const nextItems = existingItems.filter(
      (item: any) => normalizeObjectId(item?.checklistItemId) !== itemId
    );

    if (nextItems.length === existingItems.length) {
      continue;
    }

    await persistRecalculatedChecklist(checklist, nextItems);
  }
}

async function getTemplateAssignedChecklists(
  organizationId: string,
  templateId: string
) {
  return employeeChecklistRepository.getEmployeeChecklists({
    query: {
      organizationId,
      checklistTemplateId: templateId,
      isDeleted: false,
    },
    options: {
      lean: false,
      limit: 100000,
    },
  });
}

async function persistRecalculatedChecklist(checklistDoc: any, items: any[]) {
  const checklistObject =
    typeof checklistDoc.toObject === "function"
      ? checklistDoc.toObject()
      : checklistDoc;

  const recalculated = recalculateEmployeeChecklist({
    ...checklistObject,
    items,
  });

  checklistDoc.items = recalculated.items;
  checklistDoc.overallScore = recalculated.overallScore;
  checklistDoc.overallStatus = recalculated.overallStatus;
  checklistDoc.status = recalculated.status;
  checklistDoc.completedDate = recalculated.completedDate;

  await checklistDoc.save();
}

function mapTemplateItemToEmployeeChecklistItem(item: any) {
  return {
    checklistItemId: item._id,
    name: item.name,
    description: item.description,
    itemType: item.itemType,
    quantitativeRule: item.quantitativeRule ?? "percentage",
    targetValue: item.targetValue,
    threshold: item.threshold,
    unit: item.unit,
    weight: item.weight,
    dataSource: item.dataSource,
    actualValue: null,
    calculatedPercentage: undefined,
    isMet: undefined,
    managerNotes: "",
    overrideHistory: [],
  };
}

function normalizeObjectId(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof (value as any).toString === "function") {
    return (value as any).toString();
  }

  return "";
}

function recalculateEmployeeChecklist(checklist: any) {
  const items = (checklist.items || []).map((item: any) => {
    if (item.itemType !== "quantitative") return item;
    if (!hasValue(item.actualValue)) {
      return {
        ...item,
        calculatedPercentage: undefined,
        isMet: undefined,
      };
    }

    const actual = toNumber(item.actualValue);
    const target = toNumber(item.targetValue);
    const threshold = toNumber(item.threshold);

    if (actual === null) return item;

    const calculatedPercentage =
      target !== null && target > 0 ? Math.round((actual / target) * 100) : undefined;

    let isMet: boolean | undefined;
    const quantitativeRule = item.quantitativeRule ?? "percentage";

    if (threshold !== null) {
      if (quantitativeRule === "actual") {
        isMet = actual >= threshold;
      } else if (calculatedPercentage !== undefined) {
        isMet = calculatedPercentage >= threshold;
      }
    }

    return {
      ...item,
      calculatedPercentage,
      isMet,
      quantitativeRule,
    };
  });

  const filledItems = items.filter(
    (item: any) => hasValue(item.actualValue) || item.isMet !== undefined
  );
  const totalWeight = items.reduce(
    (sum: number, item: any) => sum + (toNumber(item.weight) ?? 1),
    0
  );
  const weightedSum = items.reduce((sum: number, item: any) => {
    const weight = toNumber(item.weight) ?? 1;
    if (item.itemType === "quantitative" && item.calculatedPercentage !== undefined) {
      if (item.isMet === false) {
        return sum;
      }
      return sum + Math.min(item.calculatedPercentage, 100) * weight;
    }
    if (item.itemType !== "quantitative" && item.isMet !== undefined) {
      return sum + (item.isMet ? 100 : 0) * weight;
    }
    return sum;
  }, 0);

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const allFilled = items.every(
    (item: any) => hasValue(item.actualValue) || item.isMet !== undefined
  );

  let overallStatus: "pass" | "fail" | "in-progress" | "not-started" =
    "not-started";
  if (filledItems.length > 0 && !allFilled) overallStatus = "in-progress";
  if (allFilled) overallStatus = overallScore >= 70 ? "pass" : "fail";

  let status: "assigned" | "in-progress" | "completed" | "overdue" = "assigned";
  if (allFilled) status = "completed";
  else if (filledItems.length > 0) status = "in-progress";

  if (
    status !== "completed" &&
    checklist.dueDate &&
    new Date(checklist.dueDate).getTime() < Date.now()
  ) {
    status = "overdue";
  }

  return {
    items,
    overallScore,
    overallStatus,
    status,
    completedDate:
      status === "completed"
        ? checklist.completedDate ?? new Date()
        : checklist.completedDate,
  };
}

function toNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}
