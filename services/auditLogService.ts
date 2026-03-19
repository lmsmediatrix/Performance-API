import mongoose from "mongoose";
import AuditLog, { IAuditLog } from "../models/auditLogModel";

export interface CreateAuditLogInput {
  user: mongoose.Types.ObjectId;
  type: string;
  severity?: "INFO" | "WARN" | "ERROR";
  entity?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: {
    userAgent?: string;
    ip?: string;
    path?: string;
    method?: string;
  };
  description?: string;
  organizationId?: mongoose.Types.ObjectId;
}

const auditLogService = {
  createAuditLog,
};

export default auditLogService;

async function createAuditLog(data: CreateAuditLogInput): Promise<IAuditLog> {
  return AuditLog.create({
    severity: "INFO",
    ...data,
  });
}

