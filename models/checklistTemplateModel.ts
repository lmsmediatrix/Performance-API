import mongoose, { Document, Schema, Types } from "mongoose";
import { z } from "zod";

export const ChecklistItemZodSchema = z.object({
  _id: z.any().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  itemType: z.enum(["quantitative", "qualitative", "certification"]),
  quantitativeRule: z
    .enum(["percentage", "actual"])
    .optional()
    .default("percentage"),
  targetValue: z.any().optional(),
  threshold: z.any().optional(),
  unit: z.string().optional(),
  weight: z.number().min(1).max(10).optional().default(1),
  dataSource: z.enum(["lms", "manual", "api"]).optional().default("manual"),
});

export const ChecklistTemplateZodSchema = z.object({
  _id: z.any().optional(),
  organizationId: z.custom<Types.ObjectId>().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  items: z.array(ChecklistItemZodSchema).optional().default([]),
  createdBy: z.custom<Types.ObjectId>().optional(),
  isDeleted: z.boolean().default(false),
  archive: z
    .object({
      status: z.boolean().default(false),
      date: z.union([z.date(), z.null()]).default(null),
    })
    .optional(),
});

export type IChecklistItem = z.infer<typeof ChecklistItemZodSchema> & {
  _id?: Types.ObjectId;
};

export interface IChecklistTemplate
  extends Document,
    Omit<z.infer<typeof ChecklistTemplateZodSchema>, "_id"> {
  _id: Types.ObjectId;
  items: IChecklistItem[];
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    itemType: {
      type: String,
      enum: ["quantitative", "qualitative", "certification"],
      required: true,
    },
    quantitativeRule: {
      type: String,
      enum: ["percentage", "actual"],
      default: "percentage",
    },
    targetValue: { type: Schema.Types.Mixed },
    threshold: { type: Schema.Types.Mixed },
    unit: { type: String },
    weight: { type: Number, default: 1, min: 1, max: 10 },
    dataSource: {
      type: String,
      enum: ["lms", "manual", "api"],
      default: "manual",
    },
  },
  { _id: true }
);

const ChecklistTemplateSchema = new Schema<IChecklistTemplate>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    items: { type: [ChecklistItemSchema], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    archive: {
      status: { type: Boolean, default: false },
      date: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

ChecklistTemplateSchema.index(
  { organizationId: 1, name: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const ChecklistTemplate = mongoose.model<IChecklistTemplate>(
  "ChecklistTemplate",
  ChecklistTemplateSchema,
  "checklist_templates"
);

export default ChecklistTemplate;

