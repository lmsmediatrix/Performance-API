import User, { IUser } from "../models/userModel";

interface DbParams {
  query?: Record<string, unknown>;
  populateArray?: Array<string | { path: string; select?: string }>;
  options?: {
    populateArray?: Array<string | { path: string; select?: string }>;
    select?: string;
    lean?: boolean;
    sort?: unknown;
    limit?: number;
    skip?: number;
  };
  lean?: boolean;
  match?: Record<string, unknown>;
  includeArchived?: boolean | string;
}

const userRepository = {
  getUser,
  searchUser,
  countUsers,
};

export default userRepository;

function getUser(id: string, dbParams: DbParams = {}): Promise<IUser | null> {
  let query = User.findById(id);

  if (!dbParams.query) {
    dbParams.query = {};
  }

  if (dbParams.query.includeArchived !== true) {
    query = query.where("archive.status").ne(true);

    (dbParams.options?.populateArray || []).forEach(
      (populate: string | { path: string; select?: string }) => {
        if (typeof populate === "string") {
          query = query.populate({
            path: populate,
            match: { "archive.status": { $ne: true } },
          });
          return;
        }

        query = query.populate({
          path: populate.path,
          select: populate.select,
          match: { "archive.status": { $ne: true } },
        });
      }
    );
  } else {
    (dbParams.options?.populateArray || []).forEach(
      (populate: string | { path: string; select?: string }) => {
        if (typeof populate === "string") {
          query = query.populate(populate);
          return;
        }

        query = query.populate(populate.path, populate.select);
      }
    );
  }

  const select = dbParams.options?.select || "_id";
  const lean = dbParams.options?.lean ?? true;

  query = query.select(select);
  if (lean) {
    query = query.lean();
  }

  return query.exec();
}

function searchUser(params: DbParams = {}): Promise<IUser[]> {
  const query = User.find();
  query.setQuery(params.query || {});
  query.populate(params.populateArray || []);
  query.setOptions(params.options || {});

  if (params.lean ?? true) {
    query.lean();
  }

  if (!params.includeArchived) {
    query.where({ "archive.status": { $ne: true } });
  }

  if (params.match) {
    query.where(params.match);
  }

  return query.exec();
}

function countUsers(query: Record<string, unknown>): Promise<number> {
  return User.countDocuments(query).exec();
}
