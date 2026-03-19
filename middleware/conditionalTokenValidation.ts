import { Request, Response, NextFunction } from "express";
import unifiedAuthMiddleware from "./authMiddleware";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { config } from "../config/common";

interface Exclusion {
  path: string;
  method: string;
}

// List of endpoints to exclude from token validation
const excludeFromTokenValidation: Exclusion[] = [
  {
    path: API_ENDPOINTS.MAIN.DEFAULT,
    method: config.METHOD.GET,
  },
  {
    path: API_ENDPOINTS.USER.LOGIN,
    method: config.METHOD.POST,
  },
  // {
  //   path: API_ENDPOINTS.USER.CHECKLOGIN,
  //   method: config.METHOD.POST,
  // },
  // Removing this exclusion to ensure authentication is required for student creation
  // {
  //   path: API_ENDPOINTS.STUDENT.CREATE,
  //   method: config.METHOD.POST,
  // },
];

// Middleware to conditionally validate token
const conditionalTokenValidation = (req: Request, res: Response, next: NextFunction): void => {
  const isExcluded = excludeFromTokenValidation.some(
    (exclusion) => req.path.endsWith(exclusion.path) && req.method === exclusion.method
  );
  if (isExcluded) {
    return next();
  }
  unifiedAuthMiddleware(req, res, next);
};

export default conditionalTokenValidation;
