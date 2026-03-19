import { Request, Response, NextFunction, RequestHandler } from "express";
import { USER_ROLE, ACTION } from "../config/common";
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
  };
}

interface RoleConfig {
  actions: string[];
}

const roleHierarchy: Record<(typeof USER_ROLE)[number], RoleConfig> = {
  superadmin: {
    actions: ["*"],
  },
  admin: {
    actions: [
      ACTION.GET_ALL,
      ACTION.GET_BY_ID,
      ACTION.CREATE,
      ACTION.UPDATE,
      ACTION.DELETE,
      ACTION.ARCHIVE,
      ACTION.SEARCH,
      ACTION.SEARCH_AND_UPDATE,
      ACTION.CUSTOM,
    ],
  },
  instructor: {
    actions: [
      ACTION.GET_ALL,
      ACTION.GET_BY_ID,
      ACTION.CREATE,
      ACTION.UPDATE,
      ACTION.DELETE,
      ACTION.ARCHIVE,
      ACTION.SEARCH,
      ACTION.SEARCH_AND_UPDATE,
      ACTION.CUSTOM,
    ],
  },
  student: {
    actions: [
      ACTION.GET_ALL,
      ACTION.GET_BY_ID,
      ACTION.CREATE,
      ACTION.UPDATE,
      ACTION.DELETE,
      ACTION.SEARCH,
      ACTION.SEARCH_AND_UPDATE,
      ACTION.CUSTOM,
    ],
  },
  employee: {
    actions: [
      ACTION.GET_ALL,
      ACTION.GET_BY_ID,
      ACTION.CREATE,
      ACTION.UPDATE,
      ACTION.DELETE,
      ACTION.SEARCH,
      ACTION.SEARCH_AND_UPDATE,
      ACTION.CUSTOM,
    ],
  },
  user: {
    actions: [
      ACTION.GET_ALL,
      ACTION.GET_BY_ID,
      ACTION.CREATE,
      ACTION.UPDATE,
      ACTION.DELETE,
      ACTION.SEARCH,
      ACTION.SEARCH_AND_UPDATE,
      ACTION.CUSTOM,
    ],
  },
  viewer: {
    actions: [ACTION.GET_ALL, ACTION.GET_BY_ID],
  },
};
export const validatePermissions = (allowedRoles: string[], action: string): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) {
      res.status(401).json({
        success: false,
        message: "Not authorized",
        error: "Invalid roles configuration",
      });
      return;
    }
    const normalizedUserRole = userRole.toLowerCase();
    if (!(normalizedUserRole in roleHierarchy)) {
      res.status(403).json({
        success: false,
        message: "Not authorized",
        error: "Invalid role",
      });
      return;
    }
    const isRoleAllowed = allowedRoles.some((role) => role.toLowerCase() === normalizedUserRole);
    if (!isRoleAllowed) {
      res.status(403).json({
        success: false,
        message: "Not authorized",
        error: "Role not authorized for this operation",
      });
      return;
    }
    const roleConfig = roleHierarchy[normalizedUserRole as keyof typeof roleHierarchy];
    const isValidAction = roleConfig.actions.includes("*") || roleConfig.actions.includes(action);
    if (isValidAction) {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      message: "Not authorized",
      error: `Access denied for ${action}`,
    });
    return;
  };
};
