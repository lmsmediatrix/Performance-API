import { config } from "../config/common";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import employeeChecklistRepository from "../repository/employeeChecklistRepository";
import checklistTemplateRepository from "../repository/checklistTemplateRepository";
import userRepository from "../repository/userRepository";
import { generatePagination } from "../utils/paginationUtils";
import mongoose from "mongoose";

const MANAGER_ROLES = new Set(["superadmin", "admin", "instructor"]);
const SELF_FEEDBACK_ROLES = new Set(["student", "employee", "user"]);

interface UpdateEmployeeChecklistContext {
  actor?: {
    id?: string;
    email?: string;
    role?: string;
    subrole?: string;
    token?: string;
    organizationId?: string;
  };
}

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
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = Number(params.limit) > 0 ? Number(params.limit) : 10;
    const actorRole = normalizeRole(params?.actor?.role);
    const actorSubrole = normalizeRole(params?.actor?.subrole);
    const actorId = toObjectIdString(params?.actor?.id);
    const isManagerWorkspaceActor =
      SELF_FEEDBACK_ROLES.has(actorRole) &&
      actorSubrole === "manager" &&
      Boolean(actorId);
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

    const scopedEmployeeIds = await resolveScopedEmployeeIds(params);
    if (scopedEmployeeIds && scopedEmployeeIds.length === 0) {
      const pagination = generatePagination(0, page, limit);
      return { checklists: [], pagination, count: 0 };
    }

    if (scopedEmployeeIds) {
      const scopedEmployeeFilter = {
        employeeId: { $in: toMongoIdCandidates(scopedEmployeeIds) },
      };

      // In environments where LMS direct-report lookup is unavailable,
      // managers should still see checklists they personally assigned.
      if (isManagerWorkspaceActor && actorId && !params.employeeId) {
        dbParams.query.$or = [
          scopedEmployeeFilter,
          { assignedBy: { $in: toMongoIdCandidates([actorId]) } },
        ];
      } else {
        dbParams.query.employeeId = scopedEmployeeFilter.employeeId;
      }
    }

    if (params.employeeId) {
      const requestedEmployeeId = toObjectIdString(params.employeeId);
      if (!requestedEmployeeId) {
        const pagination = generatePagination(0, page, limit);
        return { checklists: [], pagination, count: 0 };
      }

      if (
        scopedEmployeeIds &&
        !scopedEmployeeIds.some((id) => areIdsEqual(id, requestedEmployeeId))
      ) {
        const pagination = generatePagination(0, page, limit);
        return { checklists: [], pagination, count: 0 };
      }

      dbParams.query.employeeId = {
        $in: toMongoIdCandidates([requestedEmployeeId]),
      };
    }

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

async function resolveScopedEmployeeIds(params: any): Promise<string[] | null> {
  const actorRole = normalizeRole(params?.actor?.role);
  if (!actorRole || MANAGER_ROLES.has(actorRole)) {
    return null;
  }

  if (!SELF_FEEDBACK_ROLES.has(actorRole)) {
    return null;
  }

  const organizationId = toObjectIdString(params?.organizationId);
  if (!organizationId) {
    throw new Error("Organization ID is required for checklist visibility");
  }

  const actor = await resolveActorUser(params?.actor, organizationId);
  const actorId = toObjectIdString(actor?._id) || toObjectIdString(params?.actor?.id);

  if (!actorId) {
    throw new Error("User ID is required for checklist visibility");
  }

  const actorSubrole = normalizeRole((actor as any)?.subrole || params?.actor?.subrole);
  const lmsDirectReportEmployeeIds = await getLmsDirectReportEmployeeIds(
    params?.actor?.token
  );

  if (actorSubrole !== "manager") {
    if (lmsDirectReportEmployeeIds.length > 0) {
      return dedupeIdStrings([actorId, ...lmsDirectReportEmployeeIds]);
    }

    return [actorId];
  }

  const [directReportEmployeeIds, departmentEmployeeIds] = await Promise.all([
    getDirectReportEmployeeIds(actorId, organizationId),
    getDepartmentEmployeeIds(actor, organizationId),
  ]);

  return dedupeIdStrings([
    actorId,
    ...lmsDirectReportEmployeeIds,
    ...directReportEmployeeIds,
    ...departmentEmployeeIds,
  ]);
}

async function resolveActorUser(actor: any, organizationId: string): Promise<any | null> {
  const actorId = toObjectIdString(actor?.id);
  if (actorId) {
    const byId = await userRepository.getUser(actorId, {
      options: {
        select: "_id email subrole organizationId person",
        lean: true,
      },
    });

    if (byId) {
      const actorOrgId = toObjectIdString((byId as any).organizationId);
      if (!actorOrgId || areIdsEqual(actorOrgId, organizationId)) {
        return byId;
      }
    }
  }

  const actorEmail = typeof actor?.email === "string" ? actor.email.trim() : "";
  if (!actorEmail) {
    return null;
  }

  const emailRegex = new RegExp(`^${escapeRegex(actorEmail)}$`, "i");
  const matches = await userRepository.searchUser({
    query: {
      email: emailRegex,
      organizationId: { $in: toMongoIdCandidates([organizationId]) },
    },
    options: {
      select: "_id email subrole organizationId person",
      limit: 1,
      lean: true,
    },
  });

  return matches?.[0] ?? null;
}

async function getDirectReportEmployeeIds(
  actorId: string,
  organizationId: string
): Promise<string[]> {
  const users = await userRepository.searchUser({
    query: {
      organizationId: { $in: toMongoIdCandidates([organizationId]) },
      directTo: { $in: toMongoIdCandidates([actorId]) },
      role: { $in: ["student", "employee", "user"] },
    },
    options: {
      select: "_id",
      limit: 10000,
      lean: true,
    },
  });

  return dedupeIdStrings(users.map((user: any) => toObjectIdString(user?._id)));
}

async function getLmsDirectReportEmployeeIds(actorToken?: string): Promise<string[]> {
  if (!actorToken) {
    return [];
  }

  const lmsBaseUrl = resolveLmsBaseUrl();
  if (!lmsBaseUrl) {
    return [];
  }

  const lmsDirectReportsEndpoint = `${lmsBaseUrl}${API_ENDPOINTS.USER.GET_DIRECT_REPORTS}`;

  try {
    const query = new URLSearchParams({
      limit: "2000",
      skip: "0",
      pagination: "false",
      document: "true",
      count: "false",
      sort: "-createdAt",
      select: "_id id userId",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${lmsDirectReportsEndpoint}?${query.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${actorToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const users = extractLmsUserArray(payload);
    return dedupeIdStrings(
      users.map((user: any) =>
        toObjectIdString(user?._id || user?.id || user?.userId)
      )
    );
  } catch (_error) {
    return [];
  }
}

async function getDepartmentEmployeeIds(
  actor: any,
  organizationId: string
): Promise<string[]> {
  if (!actor) {
    return [];
  }

  const departmentId = toObjectIdString((actor as any)?.person?.department);
  if (!departmentId) {
    return [];
  }

  const users = await userRepository.searchUser({
    query: {
      organizationId: { $in: toMongoIdCandidates([organizationId]) },
      "person.department": { $in: toMongoIdCandidates([departmentId]) },
      role: { $in: ["student", "employee", "user"] },
    },
    options: {
      select: "_id",
      limit: 10000,
      lean: true,
    },
  });

  return dedupeIdStrings(users.map((user: any) => toObjectIdString(user?._id)));
}

async function updateEmployeeChecklist(
  data: any,
  context: UpdateEmployeeChecklistContext = {}
) {
  if (!data?._id) throw new Error("Employee checklist ID is required");
  try {
    const actorRole = normalizeRole(context.actor?.role);
    const actorSubrole = normalizeRole(context.actor?.subrole);
    const actorId = context.actor?.id;
    const actorEmail = context.actor?.email;
    const actorToken = context.actor?.token;
    const actorOrganizationId = context.actor?.organizationId;

    if (!actorRole) {
      throw new Error("User role is required for updating employee checklist");
    }

    if (!actorOrganizationId) {
      throw new Error("Organization ID is required for updating employee checklist");
    }

    const existing = await employeeChecklistRepository.getEmployeeChecklist(
      data._id,
      {
        query: { organizationId: actorOrganizationId },
      }
    );
    if (!existing) throw new Error("Employee checklist not found");

    const existingDoc =
      typeof (existing as any).toObject === "function"
        ? (existing as any).toObject()
        : existing;

    const isSelfChecklistActor =
      Boolean(actorId) &&
      String(existingDoc.employeeId) === String(actorId);
    const isAssignedEvaluator =
      Boolean(actorId) &&
      String(existingDoc.assignedBy) === String(actorId);
    const checklistEmployeeId =
      toObjectIdString(existingDoc.employeeId) || String(existingDoc.employeeId || "");
    const scopedEmployeeIds = await resolveScopedEmployeeIds({
      organizationId: actorOrganizationId,
      actor: {
        id: actorId,
        email: actorEmail,
        role: actorRole,
        subrole: actorSubrole,
        token: actorToken,
      },
    });
    const canManageChecklistByScope =
      Array.isArray(scopedEmployeeIds) &&
      scopedEmployeeIds.some((id) => areIdsEqual(id, checklistEmployeeId)) &&
      !areIdsEqual(actorId, checklistEmployeeId);
    const isManagerRole =
      MANAGER_ROLES.has(actorRole) ||
      actorSubrole === "manager" ||
      canManageChecklistByScope;

    // Employee/student/user can always update their own self-input lane.
    if (SELF_FEEDBACK_ROLES.has(actorRole) && isSelfChecklistActor && !isManagerRole) {

      const payload: any = { _id: data._id };

      if (Object.prototype.hasOwnProperty.call(data, "items")) {
        payload.items = applyEmployeeItemFeedback(existingDoc.items, data.items);
      }

      if (Object.prototype.hasOwnProperty.call(data, "employeeSelfFeedback")) {
        payload.employeeSelfFeedback = asOptionalString(data.employeeSelfFeedback);
      }

      const updated = await employeeChecklistRepository.updateEmployeeChecklist(payload);
      if (!updated) throw new Error("Employee checklist not found");
      return updated;
    }

    // Manager lane: explicit manager roles OR the user who assigned the checklist.
    if (!isManagerRole && !isAssignedEvaluator) {
      if (SELF_FEEDBACK_ROLES.has(actorRole) && !isSelfChecklistActor) {
        throw new Error("You are not allowed to evaluate this checklist");
      }
      throw new Error("Role not authorized to update this checklist");
    }

    const managerPatch: any = {};

    if (Object.prototype.hasOwnProperty.call(data, "items")) {
      managerPatch.items = data.items;
    }

    if (Object.prototype.hasOwnProperty.call(data, "managerFeedback")) {
      managerPatch.managerFeedback = asOptionalString(data.managerFeedback);
    }

    const merged = {
      ...existingDoc,
      ...managerPatch,
    };

    const recalculated = recalculateEmployeeChecklist(merged);

    const payload = {
      _id: data._id,
      ...managerPatch,
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
      employeeActualValue: existingItem.employeeActualValue,
      employeeIsMet: existingItem.employeeIsMet,
      employeeNotes: existingItem.employeeNotes ?? "",
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
    employeeActualValue: undefined,
    employeeIsMet: undefined,
    employeeNotes: "",
    overrideHistory: [],
  };
}

function applyEmployeeItemFeedback(existingItems: any[], incomingItems: any): any[] {
  const safeExistingItems = Array.isArray(existingItems) ? existingItems : [];
  const safeIncomingItems = Array.isArray(incomingItems) ? incomingItems : [];

  if (safeIncomingItems.length === 0) {
    return safeExistingItems;
  }

  const employeePatchByItemId = new Map<
    string,
    {
      hasEmployeeActualValue: boolean;
      employeeActualValue?: any;
      hasEmployeeIsMet: boolean;
      employeeIsMet?: boolean;
      hasEmployeeNotes: boolean;
      employeeNotes?: string;
    }
  >();

  safeIncomingItems.forEach((item: any) => {
    const itemId = normalizeObjectId(item?.checklistItemId);
    if (!itemId) return;

    const hasEmployeeActualValue = Object.prototype.hasOwnProperty.call(
      item,
      "employeeActualValue"
    );
    const hasEmployeeIsMet = Object.prototype.hasOwnProperty.call(
      item,
      "employeeIsMet"
    );
    const hasEmployeeNotes = Object.prototype.hasOwnProperty.call(
      item,
      "employeeNotes"
    );

    if (!hasEmployeeActualValue && !hasEmployeeIsMet && !hasEmployeeNotes) return;

    employeePatchByItemId.set(itemId, {
      hasEmployeeActualValue,
      employeeActualValue: item.employeeActualValue,
      hasEmployeeIsMet,
      employeeIsMet:
        typeof item.employeeIsMet === "boolean" ? item.employeeIsMet : undefined,
      hasEmployeeNotes,
      employeeNotes: asOptionalString(item.employeeNotes) ?? "",
    });
  });

  if (employeePatchByItemId.size === 0) {
    return safeExistingItems;
  }

  return safeExistingItems.map((item: any) => {
    const itemId = normalizeObjectId(item?.checklistItemId);
    if (!itemId || !employeePatchByItemId.has(itemId)) {
      return item;
    }

    const employeePatch = employeePatchByItemId.get(itemId)!;
    const normalizedEmployeeActualValue = employeePatch.hasEmployeeActualValue
      ? normalizeEmployeeActualValue(
          employeePatch.employeeActualValue,
          item.itemType
        )
      : item.employeeActualValue;

    return {
      ...item,
      employeeActualValue: normalizedEmployeeActualValue,
      employeeIsMet: employeePatch.hasEmployeeIsMet
        ? employeePatch.employeeIsMet
        : item.employeeIsMet,
      employeeNotes: employeePatch.hasEmployeeNotes
        ? employeePatch.employeeNotes ?? ""
        : item.employeeNotes,
    };
  });
}

function normalizeEmployeeActualValue(
  value: unknown,
  itemType: string
): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }

    if (itemType === "quantitative") {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : undefined;
    }

    return trimmed;
  }

  if (typeof value === "number") {
    if (itemType === "quantitative") {
      return Number.isFinite(value) ? value : undefined;
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function extractLmsUserArray(payload: any): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  if (Array.isArray(payload?.data?.users)) {
    return payload.data.users;
  }

  return [];
}

function resolveLmsBaseUrl(): string {
  const configuredBaseUrl =
    process.env.LMS_BASE_URL ||
    process.env.LMS_API_BASE_URL ||
    process.env.LMS_API_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return "http://localhost:5000/api";
}

function normalizeObjectId(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof (value as any).toString === "function") {
    return (value as any).toString().trim();
  }

  return "";
}

function toObjectIdString(value: unknown): string | undefined {
  const normalized = normalizeObjectId(value);
  return normalized || undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toMongoIdCandidates(values: string[]): Array<string | mongoose.Types.ObjectId> {
  const candidates: Array<string | mongoose.Types.ObjectId> = [];
  const seen = new Set<string>();

  values.forEach((rawValue) => {
    const value = (rawValue || "").trim();
    if (!value) {
      return;
    }

    const stringKey = `s:${value}`;
    if (!seen.has(stringKey)) {
      seen.add(stringKey);
      candidates.push(value);
    }

    if (mongoose.Types.ObjectId.isValid(value)) {
      const normalizedObjectId = value.toLowerCase();
      const objectKey = `o:${normalizedObjectId}`;
      if (!seen.has(objectKey)) {
        seen.add(objectKey);
        candidates.push(new mongoose.Types.ObjectId(normalizedObjectId));
      }
    }
  });

  return candidates;
}

function dedupeIdStrings(values: Array<string | undefined>): string[] {
  const deduped: string[] = [];

  values.forEach((value) => {
    const normalized = (value || "").trim();
    if (!normalized) {
      return;
    }

    const alreadyExists = deduped.some((existing) => areIdsEqual(existing, normalized));
    if (!alreadyExists) {
      deduped.push(normalized);
    }
  });

  return deduped;
}

function areIdsEqual(left?: string, right?: string): boolean {
  if (!left || !right) {
    return false;
  }

  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function normalizeRole(role: unknown): string {
  if (typeof role !== "string") {
    return "";
  }

  return role.trim().toLowerCase();
}

function asOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
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


