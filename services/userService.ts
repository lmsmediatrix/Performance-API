import { config } from "../config/common";
import userRepository from "../repository/userRepository";
import { generatePagination } from "../utils/paginationUtils";

interface ManagerContext {
  id?: string;
  email?: string;
}

const userService = {
  getDirectReports,
  searchUser,
};

export default userService;

const toObjectIdString = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length ? trimmedValue : undefined;
  }

  if (typeof value === "object" && value !== null && "toString" in value) {
    const stringValue = value.toString();
    return stringValue && stringValue !== "[object Object]" ? stringValue : undefined;
  }

  return undefined;
};

const isSameObjectId = (first?: string, second?: string): boolean => {
  if (!first || !second) {
    return false;
  }

  return first.toLowerCase() === second.toLowerCase();
};

const toSelectString = (select: unknown): string => {
  if (Array.isArray(select)) {
    return select.filter(Boolean).join(" ").trim() || "_id";
  }

  if (typeof select === "string") {
    return select.trim() || "_id";
  }

  return "_id";
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function getDirectReports(
  managerRef: string | ManagerContext,
  organizationId: string,
  params: any = {}
): Promise<any> {
  let managerContext: ManagerContext = {};
  if (typeof managerRef === "object" && managerRef !== null) {
    managerContext = managerRef as ManagerContext;
  } else {
    managerContext = { id: managerRef };
  }

  if (!managerContext.id && !managerContext.email) {
    throw new Error(config.ERROR.USER.NO_ID);
  }

  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  let manager = null;

  if (managerContext.id) {
    manager = await userRepository.getUser(managerContext.id, {
      options: {
        select: "_id role subrole organizationId email",
        lean: true,
      },
    });
  }

  if (!manager && managerContext.email) {
    const emailRegex = new RegExp(`^${escapeRegex(managerContext.email.trim())}$`, "i");
    const managers = await userRepository.searchUser({
      query: {
        email: emailRegex,
        organizationId,
      },
      options: {
        select: "_id role subrole organizationId email",
        limit: 1,
      },
      lean: true,
    });
    manager = managers?.[0] ?? null;
  }

  if (!manager) {
    throw new Error(config.ERROR.USER.NOT_FOUND);
  }

  const managerOrganizationId = toObjectIdString((manager as any).organizationId);
  if (!isSameObjectId(managerOrganizationId, organizationId)) {
    throw new Error(config.ERROR.USER.NOT_AUTHORIZED);
  }

  if ((manager as any).subrole !== "manager") {
    throw new Error("Only manager users can view direct reports.");
  }

  const resolvedManagerId = toObjectIdString((manager as any)._id);
  if (!resolvedManagerId) {
    throw new Error(config.ERROR.USER.NO_ID);
  }

  const query = {
    ...(params.query || {}),
    directTo: resolvedManagerId,
    organizationId,
  };

  return searchUser({
    ...params,
    query,
  });
}

async function searchUser(params: any): Promise<any> {
  try {
    const dbParams: {
      query: any;
      populateArray: any[];
      options: any;
      lean: boolean;
      match: any;
      includeArchived?: boolean | string;
      archivedOnly?: boolean;
      pagination?: boolean;
      document?: boolean;
    } = {
      query: {},
      populateArray: [],
      options: {},
      lean: true,
      match: {},
      includeArchived: params.includeArchived,
      archivedOnly: params.archivedOnly,
    };

    dbParams.query = params.query || {};

    if (params.archivedOnly === true) {
      dbParams.query["archive.status"] = true;
      dbParams.includeArchived = true;
    }

    if (params.match) {
      dbParams.query = { ...dbParams.query, ...params.match };
    }

    if (params.populateArray) {
      dbParams.populateArray = params.populateArray;
    }

    const optionsObj = {
      sort: params.sort || "-createdAt",
      skip: params.skip || 0,
      select: toSelectString(params.select),
      limit: params.limit || 10,
    };

    dbParams.options = optionsObj;
    dbParams.lean = params.lean ?? true;

    const [users, count] = await Promise.all([
      userRepository.searchUser(dbParams),
      params.pagination || params.count
        ? userRepository.countUsers(dbParams.query)
        : Promise.resolve(0),
    ]);

    if (!params.pagination) {
      return params.count ? { users, count } : users;
    }

    const pagination = generatePagination(count, optionsObj.skip + 1, optionsObj.limit);
    return {
      ...(params.document && { users }),
      ...(params.pagination && { pagination }),
      ...(params.count && { count }),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error(String(error));
  }
}
