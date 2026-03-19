import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAuditLog extends Document {
  user: Types.ObjectId;
  type: string;
  severity: "INFO" | "WARN" | "ERROR";
  entity?: {
    type: string;
    id: Types.ObjectId;
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
  organizationId?: Types.ObjectId;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    severity: { type: String, enum: ["INFO", "WARN", "ERROR"], default: "INFO" },
    entity: {
      type: {
        type: String,
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    metadata: {
      userAgent: String,
      ip: String,
      path: String,
      method: String,
    },
    description: String,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema, "audit_logs");

export default AuditLog;

