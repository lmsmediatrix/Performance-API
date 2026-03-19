import EmployeeChecklist, {
  IEmployeeChecklist,
} from "../models/employeeChecklistModel";

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

const employeeChecklistRepository = {
  getEmployeeChecklist,
  getEmployeeChecklists,
  getEmployeeChecklistsCount,
  createEmployeeChecklist,
  updateEmployeeChecklist,
  archiveEmployeeChecklist,
  searchEmployeeChecklist,
  findOneByEmployeeAndTemplate,
};

export default employeeChecklistRepository;

function getEmployeeChecklist(
  id: string,
  dbParams: DbParams = {}
): Promise<IEmployeeChecklist | null> {
  let query = EmployeeChecklist.findOne({ _id: id, ...(dbParams.query || {}) });

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

function getEmployeeChecklists(
  dbParams: DbParams
): Promise<IEmployeeChecklist[]> {
  let query = EmployeeChecklist.find(dbParams.query || {});

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

function getEmployeeChecklistsCount(query: any): Promise<number> {
  return EmployeeChecklist.countDocuments(query).exec();
}

function createEmployeeChecklist(
  data: Partial<IEmployeeChecklist>
): Promise<IEmployeeChecklist> {
  return EmployeeChecklist.create(data);
}

function updateEmployeeChecklist(
  data: Partial<IEmployeeChecklist>
): Promise<IEmployeeChecklist | null> {
  return EmployeeChecklist.findByIdAndUpdate(
    data._id,
    { $set: data },
    { new: true }
  );
}

function archiveEmployeeChecklist(
  id: string
): Promise<IEmployeeChecklist | null> {
  return EmployeeChecklist.findByIdAndUpdate(
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

function searchEmployeeChecklist(
  dbParams: DbParams
): Promise<IEmployeeChecklist[]> {
  return getEmployeeChecklists(dbParams);
}

function findOneByEmployeeAndTemplate(
  organizationId: string,
  employeeId: string,
  checklistTemplateId: string
): Promise<IEmployeeChecklist | null> {
  return EmployeeChecklist.findOne({
    organizationId,
    employeeId,
    checklistTemplateId,
    isDeleted: false,
  }).exec();
}

