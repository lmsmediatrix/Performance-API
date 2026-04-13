import mongoose, { Document, Schema, Types } from "mongoose";
import { z } from "zod";

export const EmployeeChecklistItemZodSchema = z.object({
  checklistItemId: z.custom<Types.ObjectId>().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  itemType: z.enum(["quantitative", "qualitative", "certification"]).optional(),
  quantitativeRule: z.enum(["percentage", "actual"]).optional(),
  targetValue: z.any().optional(),
  threshold: z.any().optional(),
  unit: z.string().optional(),
  weight: z.number().optional(),
  dataSource: z.enum(["lms", "manual", "api"]).optional(),
  actualValue: z.any().optional(),
  calculatedPercentage: z.number().optional(),
  isMet: z.boolean().optional(),
  managerNotes: z.string().optional(),
  employeeActualValue: z.any().optional(),
  employeeIsMet: z.boolean().optional(),
  employeeNotes: z.string().optional(),
  overrideHistory: z
    .array(
      z.object({
        overriddenBy: z.custom<Types.ObjectId>(),
        oldValue: z.any().optional(),
        newValue: z.any().optional(),
        reason: z.string().optional(),
        overrideDate: z.date().optional(),
      })
    )
    .optional()
    .default([]),
});

export const EmployeeChecklistZodSchema = z.object({
  _id: z.any().optional(),
  organizationId: z.custom<Types.ObjectId>(),
  employeeId: z.string(),
  checklistTemplateId: z.custom<Types.ObjectId>(),
  assignedBy: z.custom<Types.ObjectId>(),
  assignedDate: z.date().optional(),
  dueDate: z.date().optional(),
  status: z
    .enum(["assigned", "in-progress", "completed", "overdue"])
    .optional()
    .default("assigned"),
  items: z.array(EmployeeChecklistItemZodSchema).optional().default([]),
  overallScore: z.number().optional(),
  overallStatus: z
    .enum(["pass", "fail", "in-progress", "not-started"])
    .optional()
    .default("not-started"),
  managerFeedback: z.string().optional(),
  employeeSelfFeedback: z.string().optional(),
  completedDate: z.date().optional(),
  isDeleted: z.boolean().default(false),
  archive: z
    .object({
      status: z.boolean().default(false),
      date: z.union([z.date(), z.null()]).default(null),
    })
    .optional(),
});

export type IEmployeeChecklistItem = z.infer<typeof EmployeeChecklistItemZodSchema>;

export interface IEmployeeChecklist
  extends Document,
    Omit<z.infer<typeof EmployeeChecklistZodSchema>, "_id"> {
  _id: Types.ObjectId;
  items: IEmployeeChecklistItem[];
}

const EmployeeChecklistItemSchema = new Schema<IEmployeeChecklistItem>(
  {
    checklistItemId: { type: Schema.Types.ObjectId },
    name: { type: String },
    description: { type: String },
    itemType: {
      type: String,
      enum: ["quantitative", "qualitative", "certification"],
    },
    quantitativeRule: {
      type: String,
      enum: ["percentage", "actual"],
      default: "percentage",
    },
    targetValue: { type: Schema.Types.Mixed },
    threshold: { type: Schema.Types.Mixed },
    unit: { type: String },
    weight: { type: Number },
    dataSource: { type: String, enum: ["lms", "manual", "api"] },
    actualValue: { type: Schema.Types.Mixed },
    calculatedPercentage: { type: Number },
    isMet: { type: Boolean },
    managerNotes: { type: String },
    employeeActualValue: { type: Schema.Types.Mixed },
    employeeIsMet: { type: Boolean },
    employeeNotes: { type: String },
    overrideHistory: [
      {
        overriddenBy: { type: Schema.Types.ObjectId, ref: "User" },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
        reason: { type: String },
        overrideDate: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const EmployeeChecklistSchema = new Schema<IEmployeeChecklist>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    checklistTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "ChecklistTemplate",
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["assigned", "in-progress", "completed", "overdue"],
      default: "assigned",
    },
    items: { type: [EmployeeChecklistItemSchema], default: [] },
    overallScore: { type: Number },
    overallStatus: {
      type: String,
      enum: ["pass", "fail", "in-progress", "not-started"],
      default: "not-started",
    },
    managerFeedback: { type: String },
    employeeSelfFeedback: { type: String },
    completedDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
    archive: {
      status: { type: Boolean, default: false },
      date: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

EmployeeChecklistSchema.index(
  { organizationId: 1, employeeId: 1, checklistTemplateId: 1 },
  {}
);

const EmployeeChecklist = mongoose.model<IEmployeeChecklist>(
  "EmployeeChecklist",
  EmployeeChecklistSchema,
  "employee_checklists"
);

export default EmployeeChecklist;

