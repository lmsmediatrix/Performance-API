import ChecklistTemplate, {
  IChecklistTemplate,
} from "../models/checklistTemplateModel";

interface DbParams {
  query?: any;
  options?: {
    populateArray?: any[];
    select?: string;
    lean?: boolean;
    sort?: any;
    limit?: number;
    skip?: number;
  };
}

const checklistTemplateRepository = {
  getChecklistTemplate,
  getChecklistTemplates,
  getChecklistTemplatesCount,
  createChecklistTemplate,
  updateChecklistTemplate,
  archiveChecklistTemplate,
  searchChecklistTemplate,
};

export default checklistTemplateRepository;

function getChecklistTemplate(
  id: string,
  dbParams: DbParams = {}
): Promise<IChecklistTemplate | null> {
  let query = ChecklistTemplate.findOne({ _id: id, ...(dbParams.query || {}) });

  if (dbParams.options?.populateArray) {
    dbParams.options.populateArray.forEach((pop: any) => {
      query = query.populate(pop);
    });
  }

  if (dbParams.options?.select) {
    query = query.select(dbParams.options.select);
  }

  if (dbParams.options?.lean) {
    query = query.lean();
  }

  return query.exec();
}

function getChecklistTemplates(
  dbParams: DbParams
): Promise<IChecklistTemplate[]> {
  let query = ChecklistTemplate.find(dbParams.query || {});

  if (dbParams.options?.sort) {
    query = query.sort(dbParams.options.sort);
  }
  if (dbParams.options?.skip) {
    query = query.skip(dbParams.options.skip);
  }
  if (dbParams.options?.limit) {
    query = query.limit(dbParams.options.limit);
  }
  if (dbParams.options?.select) {
    query = query.select(dbParams.options.select);
  }
  if (dbParams.options?.lean) {
    query = query.lean();
  }

  return query.exec();
}

function getChecklistTemplatesCount(query: any): Promise<number> {
  return ChecklistTemplate.countDocuments(query).exec();
}

function createChecklistTemplate(
  data: Partial<IChecklistTemplate>
): Promise<IChecklistTemplate> {
  return ChecklistTemplate.create(data);
}

function updateChecklistTemplate(
  data: Partial<IChecklistTemplate>
): Promise<IChecklistTemplate | null> {
  return ChecklistTemplate.findByIdAndUpdate(
    data._id,
    { $set: data },
    { new: true }
  );
}

function archiveChecklistTemplate(
  id: string
): Promise<IChecklistTemplate | null> {
  return ChecklistTemplate.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
        "archive.status": true,
        "archive.date": new Date(),
      },
    },
    { new: true }
  );
}

function searchChecklistTemplate(
  dbParams: DbParams
): Promise<IChecklistTemplate[]> {
  return getChecklistTemplates(dbParams);
}

