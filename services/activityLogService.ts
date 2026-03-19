import mongoose from "mongoose";
import ActivityLog, { IActivityLog } from "../models/activityLogModel";

export interface CreateActivityLogInput {
  userId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  action: string;
  description?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
}

const activityLogService = {
  createActivityLog,
};

export default activityLogService;

async function createActivityLog(data: CreateActivityLogInput): Promise<IActivityLog> {
  return ActivityLog.create(data);
}

