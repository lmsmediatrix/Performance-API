import mongoose, { Document, Schema, Types } from "mongoose";

export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  action: string;
  description?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: Types.ObjectId;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    action: { type: String, required: true },
    description: { type: String },
    path: { type: String },
    method: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema, "activity_logs");

export default ActivityLog;

