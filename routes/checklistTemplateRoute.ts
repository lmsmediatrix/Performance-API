import express, { Request, Response } from "express";
import { API_ENDPOINTS } from "../config/endpointsConfig";
import { validatePermissions } from "../middleware/rabcMiddleware";
import { ACTION, USER_ROLES, config } from "../config/common";
import checklistTemplateService from "../services/checklistTemplateService";
import { handleZodError } from "../middleware/zodErrorHandler";

const router = express.Router();
const PERFORMANCE_ALLOWED_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.INSTRUCTOR,
  USER_ROLES.STUDENT,
];

router.get(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.GET_ALL,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.GET_ALL),
  async (req: Request, res: Response) => {
    try {
      const result = await checklistTemplateService.getChecklistTemplates({
        organizationId: (req as any).user?.organizationId,
        page: req.query.page,
        limit: req.query.limit,
      });
      res.status(200).json({ message: config.SUCCESS.CHECKLIST_TEMPLATE.GET_ALL, ...result });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.get(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.GET_BY_ID,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.GET_BY_ID),
  async (req: Request, res: Response) => {
    try {
      const template = await checklistTemplateService.getChecklistTemplate(req.params.id, {
        organizationId: (req as any).user?.organizationId,
      });
      res
        .status(200)
        .json({ message: config.SUCCESS.CHECKLIST_TEMPLATE.GET_BY_ID, data: template });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.post(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.CREATE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.CREATE),
  async (req: Request, res: Response) => {
    try {
      const data = {
        ...req.body,
        organizationId: (req as any).user?.organizationId,
        createdBy: (req as any).user?.id,
      };
      const template = await checklistTemplateService.createChecklistTemplate(data);
      res.status(201).json({ message: config.SUCCESS.CHECKLIST_TEMPLATE.CREATE, data: template });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.put(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.UPDATE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const updated = await checklistTemplateService.updateChecklistTemplate({
        ...req.body,
        organizationId: (req as any).user?.organizationId,
      });
      res.status(200).json({ message: config.SUCCESS.CHECKLIST_TEMPLATE.UPDATE, data: updated });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.put(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.ARCHIVE,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.ARCHIVE),
  async (req: Request, res: Response) => {
    try {
      const archived = await checklistTemplateService.archiveChecklistTemplate(
        req.params.id,
        (req as any).user?.organizationId
      );
      res.status(200).json({ message: config.SUCCESS.CHECKLIST_TEMPLATE.ARCHIVE, data: archived });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.post(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.ADD_ITEM,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.CREATE),
  async (req: Request, res: Response) => {
    try {
      const updated = await checklistTemplateService.addChecklistTemplateItem({
        templateId: req.params.templateId,
        organizationId: (req as any).user?.organizationId,
        item: req.body,
      });
      res.status(201).json({
        message: config.SUCCESS.CHECKLIST_TEMPLATE.ADD_ITEM,
        data: updated,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.put(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.UPDATE_ITEM,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.UPDATE),
  async (req: Request, res: Response) => {
    try {
      const updated = await checklistTemplateService.updateChecklistTemplateItem({
        templateId: req.params.templateId,
        itemId: req.params.itemId,
        organizationId: (req as any).user?.organizationId,
        item: req.body,
      });
      res.status(200).json({
        message: config.SUCCESS.CHECKLIST_TEMPLATE.UPDATE_ITEM,
        data: updated,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

router.delete(
  API_ENDPOINTS.CHECKLIST_TEMPLATE.REMOVE_ITEM,
  validatePermissions(PERFORMANCE_ALLOWED_ROLES, ACTION.DELETE),
  async (req: Request, res: Response) => {
    try {
      const updated = await checklistTemplateService.removeChecklistTemplateItem({
        templateId: req.params.templateId,
        itemId: req.params.itemId,
        organizationId: (req as any).user?.organizationId,
      });
      res.status(200).json({
        message: config.SUCCESS.CHECKLIST_TEMPLATE.REMOVE_ITEM,
        data: updated,
      });
    } catch (error) {
      handleZodError(error, res);
    }
  }
);

export default router;
