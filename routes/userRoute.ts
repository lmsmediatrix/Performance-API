import express, { Response } from "express";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { config } from "../config/common";
import { handleZodError } from "../middleware/zodErrorHandler";
import userService from "../services/userService";
import { ValidationSchemas } from "../helper/validationSchemas";
import { CustomRequest } from "../type/types";
import unifiedAuthMiddleware from "../middleware/authMiddleware";

const router = express.Router();

const firstQueryValue = (value: unknown): unknown => (Array.isArray(value) ? value[0] : value);

const parseQueryObject = (value: unknown): Record<string, unknown> => {
  const normalized = firstQueryValue(value);

  if (!normalized) {
    return {};
  }

  if (typeof normalized === "string") {
    try {
      const parsed = JSON.parse(normalized);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch (_error) {
      return {};
    }
  }

  if (typeof normalized === "object" && !Array.isArray(normalized)) {
    return normalized as Record<string, unknown>;
  }

  return {};
};

const parseBooleanQuery = (value: unknown): boolean => {
  const normalized = firstQueryValue(value);
  if (typeof normalized === "boolean") {
    return normalized;
  }
  if (typeof normalized === "string") {
    return normalized.toLowerCase() === "true";
  }
  return false;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => entry?.toString())
      .filter((entry): entry is string => Boolean(entry));
  }

  const normalized = firstQueryValue(value);
  if (normalized === undefined || normalized === null) {
    return [];
  }

  const asString = normalized.toString();
  return asString ? [asString] : [];
};

router.get(API_ENDPOINTS.USER.GET_DIRECT_REPORTS, unifiedAuthMiddleware, getDirectReports);

export async function getDirectReports(req: CustomRequest, res: Response) {
  try {
    if (!req.user || !req.user.id || !req.user.organizationId) {
      throw new Error(config.ERROR.USER.NOT_AUTHORIZED);
    }

    const populateArrayValue = toStringArray(req.query.populateArray).join(" ");
    const populateSelectValue = toStringArray((req.query as any).populateSelect).join(",");

    const params = ValidationSchemas.getQueriesParams.parse({
      query: parseQueryObject(req.query.query),
      populateArray: populateArrayValue
        ? populateArrayValue.split(" ").map((path, index) => ({
            path,
            select: populateSelectValue.split(",")[index]?.trim() || "",
          }))
        : [],
      sort: firstQueryValue(req.query.sort),
      limit: firstQueryValue(req.query.limit),
      skip: firstQueryValue(req.query.skip),
      select: toStringArray(req.query.select),
      lean: firstQueryValue(req.query.lean),
      count: parseBooleanQuery(req.query.count),
      document: parseBooleanQuery(req.query.document),
      pagination: parseBooleanQuery(req.query.pagination),
    });

    const directReports = await userService.getDirectReports(
      {
        id: req.user.id,
        email: req.user.email,
      },
      req.user.organizationId,
      params
    );

    const data = Array.isArray(directReports) ? directReports : (directReports?.users ?? []);
    const pagination = Array.isArray(directReports) ? undefined : directReports?.pagination;
    const count = Array.isArray(directReports) ? undefined : directReports?.count;

    res.status(200).send({
      message: "Direct reports retrieved successfully",
      data,
      ...(pagination ? { pagination } : {}),
      ...(count !== undefined ? { count } : {}),
    });
  } catch (error) {
    handleZodError(error, res);
  }
}

export default router;
