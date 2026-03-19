import { config } from "../config/common";
import {
  ChecklistItemZodSchema,
  ChecklistTemplateZodSchema,
} from "../models/checklistTemplateModel";
import checklistTemplateRepository from "../repository/checklistTemplateRepository";
import { generatePagination } from "../utils/paginationUtils";

const checklistTemplateService = {
  getChecklistTemplate,
  getChecklistTemplates,
  createChecklistTemplate,
  updateChecklistTemplate,
  archiveChecklistTemplate,
  addChecklistTemplateItem,
  updateChecklistTemplateItem,
  removeChecklistTemplateItem,
};

export default checklistTemplateService;

async function getChecklistTemplate(id: string, params: any) {
  if (!id) throw new Error("Checklist template ID is required");
  try {
    const dbParams: any = { query: {}, options: {} };
    if (params?.populateArray) dbParams.options.populateArray = params.populateArray;
    if (params?.select) dbParams.options.select = params.select.join(" ");
    if (params?.lean !== undefined) dbParams.options.lean = params.lean;
    if (params?.organizationId) dbParams.query.organizationId = params.organizationId;

    const template = await checklistTemplateRepository.getChecklistTemplate(id, dbParams);
    if (!template) {
      throw new Error("Checklist template not found");
    }
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function getChecklistTemplates(params: any) {
  if (!params) {
    throw new Error("Invalid parameters for getting checklist templates");
  }
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

    if (params.organizationId) {
      dbParams.query.organizationId = params.organizationId;
    }

    const [templates, count] = await Promise.all([
      checklistTemplateRepository.getChecklistTemplates(dbParams),
      checklistTemplateRepository.getChecklistTemplatesCount(dbParams.query),
    ]);

    const pagination = generatePagination(count, page, limit);

    return { templates, pagination, count };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function createChecklistTemplate(data: any) {
  if (!data) {
    throw new Error("Invalid parameters for creating checklist template");
  }
  try {
    const payload = ChecklistTemplateZodSchema.parse(data);
    const template = await checklistTemplateRepository.createChecklistTemplate(payload);
    // Simple log so we can verify checklist templates are being saved
    // and see their organization / id in the server logs.
    // eslint-disable-next-line no-console
    console.log("[ChecklistTemplateService] Created template", {
      id: template._id.toString(),
      name: (template as any).name,
      organizationId: (template as any).organizationId?.toString?.(),
      createdBy: (template as any).createdBy?.toString?.(),
    });
    return template;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[ChecklistTemplateService] Create failed", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function updateChecklistTemplate(data: any) {
  if (!data?._id) {
    throw new Error("Checklist template ID is required");
  }
  if (!data?.organizationId) {
    throw new Error("Organization ID is required");
  }
  try {
    const template = await getTemplateForWrite(data._id, data.organizationId);

    if (data.name !== undefined) {
      template.name = data.name;
    }
    if (data.description !== undefined) {
      template.description = data.description;
    }
    if (Array.isArray(data.items)) {
      template.items = data.items.map((item: any) =>
        ChecklistItemZodSchema.parse(item)
      ) as any;
    }

    await template.save();
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function archiveChecklistTemplate(id: string, organizationId: string) {
  if (!id) {
    throw new Error("Checklist template ID is required");
  }
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }
  try {
    const template = await getTemplateForWrite(id, organizationId);
    template.isDeleted = true;
    template.archive = {
      status: true,
      date: new Date(),
    };
    await template.save();
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function addChecklistTemplateItem(data: any) {
  if (!data?.templateId) {
    throw new Error("Checklist template ID is required");
  }
  if (!data?.organizationId) {
    throw new Error("Organization ID is required");
  }
  if (!data?.item) {
    throw new Error("Checklist item payload is required");
  }

  try {
    const template = await getTemplateForWrite(
      data.templateId,
      data.organizationId
    );
    const item = ChecklistItemZodSchema.parse(data.item);
    (template.items as any).push(item);
    await template.save();
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function updateChecklistTemplateItem(data: any) {
  if (!data?.templateId) {
    throw new Error("Checklist template ID is required");
  }
  if (!data?.itemId) {
    throw new Error("Checklist item ID is required");
  }
  if (!data?.organizationId) {
    throw new Error("Organization ID is required");
  }
  if (!data?.item) {
    throw new Error("Checklist item payload is required");
  }

  try {
    const template = await getTemplateForWrite(
      data.templateId,
      data.organizationId
    );
    const itemIndex = (template.items || []).findIndex(
      (item: any) => item._id?.toString() === data.itemId
    );

    if (itemIndex < 0) {
      throw new Error("Checklist item not found");
    }

    const currentItem = (template.items as any)[itemIndex];
    const currentItemObject =
      typeof currentItem.toObject === "function"
        ? currentItem.toObject()
        : currentItem;

    const nextItem = ChecklistItemZodSchema.parse({
      ...currentItemObject,
      ...data.item,
    });

    (template.items as any)[itemIndex] = {
      ...nextItem,
      _id: currentItem._id,
    };

    await template.save();
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function removeChecklistTemplateItem(data: any) {
  if (!data?.templateId) {
    throw new Error("Checklist template ID is required");
  }
  if (!data?.itemId) {
    throw new Error("Checklist item ID is required");
  }
  if (!data?.organizationId) {
    throw new Error("Organization ID is required");
  }

  try {
    const template = await getTemplateForWrite(
      data.templateId,
      data.organizationId
    );
    const currentItems = template.items || [];
    const nextItems = currentItems.filter(
      (item: any) => item._id?.toString() !== data.itemId
    );

    if (nextItems.length === currentItems.length) {
      throw new Error("Checklist item not found");
    }

    (template as any).items = nextItems;
    await template.save();
    return template;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

async function getTemplateForWrite(templateId: string, organizationId: string) {
  const template = await checklistTemplateRepository.getChecklistTemplate(
    templateId,
    {
      query: {
        organizationId,
        isDeleted: false,
      },
      options: {
        lean: false,
      },
    }
  );

  if (!template) {
    throw new Error("Checklist template not found");
  }

  return template;
}

