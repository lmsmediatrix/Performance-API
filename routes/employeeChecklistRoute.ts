import express, { Request, Response } from "express";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { validatePermissions } from "../middleware/rabcMiddleware";
import { ACTION, USER_ROLES, config } from "../config/common";
import employeeChecklistService from "../services/employeeChecklistService";
import { handleZodError } from "../middleware/zodErrorHandler";

const router = express.Router();
const PERFORMANCE_ALLOWED_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.INSTRUCTOR,
  USER_ROLES.STUDENT,
];

router.get(
  API_ENDPOINTS.EMPLOYEE_CHECKLIST.GET_ALL,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.GET_ALL),
  async (req: Request, res: Response) => {
    try {
      const result = await employeeChecklistService.getEmployeeChecklists({
        organizationId: (req as any).user?.organizationId,
        page: req.query.page,
        limit: req.query.limit,
      });
      res
        .status(200)
        .json({ message: config.SUCCESS.EMPLOYEE_CHECKLIST.GET_ALL, ...result });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.get(
  API_ENDPOINTS.EMPLOYEE_CHECKLIST.GET_BY_ID,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.GET_BY_ID),
  async (req: Request, res: Response) => {
    try {
      const checklist = await employeeChecklistService.getEmployeeChecklist(
        req.params.id,
        { organizationId: (req as any).user?.organizationId }
      );
      res.status(200).json({
        message: config.SUCCESS.EMPLOYEE_CHECKLIST.GET_BY_ID,
        data: checklist,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.post(
  API_ENDPOINTS.EMPLOYEE_CHECKLIST.CREATE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.CREATE),
  async (req: Request, res: Response) => {
    try {
      const payload = {
        ...req.body,
        organizationId: (req as any).user?.organizationId,
        assignedBy: (req as any).user?.id,
      };
      const checklist = await employeeChecklistService.assignChecklist(payload);
      res.status(201).json({
        message: config.SUCCESS.EMPLOYEE_CHECKLIST.CREATE,
        data: checklist,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.put(
  API_ENDPOINTS.EMPLOYEE_CHECKLIST.UPDATE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const updated = await employeeChecklistService.updateEmployeeChecklist(req.body);
      res.status(200).json({
        message: config.SUCCESS.EMPLOYEE_CHECKLIST.UPDATE,
        data: updated,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.put(
  API_ENDPOINTS.EMPLOYEE_CHECKLIST.ARCHIVE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.ARCHIVE),
  async (req: Request, res: Response) => {
    try {
      const archived = await employeeChecklistService.archiveEmployeeChecklist(
        req.params.id
      );
      res.status(200).json({
        message: config.SUCCESS.EMPLOYEE_CHECKLIST.ARCHIVE,
        data: archived,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

export default router;

