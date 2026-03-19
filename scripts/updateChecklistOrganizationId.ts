import mongoose from "mongoose";
import connectDb from "../config/dbConnection";
import ChecklistTemplate from "../models/checklistTemplateModel";
import EmployeeChecklist from "../models/employeeChecklistModel";

// Default organization id for checklist data (Uzaro University)
const DEFAULT_NEW_ORG_ID = "69aa7492ac4fedd36fe18688";

function mustGetObjectId(key: string): mongoose.Types.ObjectId {
  let raw = process.env[key];

  // Fallback to default org id when NEW_ORGANIZATION_ID is not provided
  if ((!raw || !mongoose.isValidObjectId(raw)) && key === "NEW_ORGANIZATION_ID") {
    raw = DEFAULT_NEW_ORG_ID;
  }

  if (!raw || !mongoose.isValidObjectId(raw)) {
    throw new Error(
      `Missing/invalid ${key}. Provide a Mongo ObjectId string via env var.`
    );
  }
  return new mongoose.Types.ObjectId(raw);
}

function getOptionalObjectId(key: string): mongoose.Types.ObjectId | undefined {
  const raw = process.env[key];
  if (!raw) return undefined;
  if (!mongoose.isValidObjectId(raw)) {
    throw new Error(`Invalid ${key}. Must be a Mongo ObjectId string.`);
  }
  return new mongoose.Types.ObjectId(raw);
}

async function main() {
  await connectDb();

  const newOrgId = mustGetObjectId("NEW_ORGANIZATION_ID");
  const oldOrgId = getOptionalObjectId("OLD_ORGANIZATION_ID");

  const templateFilter: Record<string, unknown> = { isDeleted: false };
  const employeeChecklistFilter: Record<string, unknown> = { isDeleted: false };

  if (oldOrgId) {
    templateFilter.organizationId = oldOrgId;
    employeeChecklistFilter.organizationId = oldOrgId;
  }

  // Templates have a unique index on (organizationId + name + isDeleted=false).
  // To avoid duplicate key failures, migrate templates one-by-one and handle collisions.
  const templates = await ChecklistTemplate.find(templateFilter, { _id: 1, name: 1 }).lean();
  let templatesUpdated = 0;
  let templatesSkippedDueToDuplicate = 0;
  let templatesSoftDeletedDueToDuplicate = 0;

  for (const t of templates) {
    try {
      const res = await ChecklistTemplate.updateOne(
        { _id: t._id },
        { $set: { organizationId: newOrgId } }
      );
      templatesUpdated += res.modifiedCount;
    } catch (err: any) {
      // Duplicate key means the destination org already has a template with same name.
      const message = typeof err?.message === "string" ? err.message : "";
      if (message.includes("E11000 duplicate key error")) {
        templatesSkippedDueToDuplicate += 1;
        // Soft-delete the source so future migrations won't keep failing.
        const delRes = await ChecklistTemplate.updateOne(
          { _id: t._id },
          {
            $set: {
              isDeleted: true,
              archive: { status: true, date: new Date() },
            },
          }
        );
        templatesSoftDeletedDueToDuplicate += delRes.modifiedCount;
        continue;
      }
      throw err;
    }
  }

  const employeeResult = await EmployeeChecklist.updateMany(employeeChecklistFilter, {
    $set: { organizationId: newOrgId },
  });

  console.log(
    [
      "OrganizationId update complete:",
      `- newOrgId=${newOrgId.toHexString()}`,
      oldOrgId
        ? `- oldOrgId=${oldOrgId.toHexString()}`
        : "- oldOrgId=(not set; attempted ALL non-deleted records)",
      `- checklist_templates found=${templates.length} updated=${templatesUpdated} duplicatesSkipped=${templatesSkippedDueToDuplicate} duplicatesSoftDeleted=${templatesSoftDeletedDueToDuplicate}`,
      `- employee_checklists matched=${employeeResult.matchedCount} modified=${employeeResult.modifiedCount}`,
    ].join("\n")
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Update failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

