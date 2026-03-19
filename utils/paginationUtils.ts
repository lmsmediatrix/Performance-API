export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function generatePagination(totalItems: number, page: number, limit: number): Pagination {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export interface PopulationOption {
  path: string;
  select?: string;
  count?: boolean;
  pagination?: boolean;
  limit?: number;
  skip?: number;
  match?: any;
  sort?: any;
}

export async function generatePopulatedFieldPagination(
  model: any,
  documentId: any,
  populateOption: PopulationOption
): Promise<Pagination | null> {
  const fieldPath = populateOption.path;
  if (!fieldPath) return null;

  const countQuery = { _id: documentId };
  const countResult = await model
    .aggregate([
      { $match: countQuery },
      {
        $project: {
          totalCount: { $size: "$students" },
        },
      },
    ])
    .exec();

  let totalCount = countResult[0]?.totalCount || 0;
  if (totalCount === 0) {
    const doc = await model.findById(documentId).lean();
    if (doc && doc[fieldPath]) {
      totalCount = Array.isArray(doc[fieldPath]) ? doc[fieldPath].length : 0;
    }
  }

  const limit = populateOption.limit || 10;
  const skip = (populateOption.skip || 0) * limit;
  const currentPage = Math.floor(skip / limit) + 1;

  return generatePagination(totalCount, currentPage, limit);
}

export async function applyPaginationToPopulatedFields(
  model: any,
  documents: any[],
  populateOptions: PopulationOption[]
): Promise<void> {
  if (!documents.length || !populateOptions?.length) return;

  for (const document of documents) {
    if (!document._paginations) document._paginations = {};

    for (const popOption of populateOptions) {
      if (popOption.count || popOption.pagination) {
        const pagination = await generatePopulatedFieldPagination(model, document._id, popOption);

        if (pagination && popOption.path) {
          document._paginations[popOption.path] = pagination;
        }
      }
    }
  }
}
