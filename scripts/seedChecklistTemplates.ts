import mongoose from "mongoose";
import connectDb from "../config/dbConnection";
import ChecklistTemplate from "../models/checklistTemplateModel";

// Defaults for Uzaro University admin and organization
const DEFAULT_ORGANIZATION_ID = "69aa7492ac4fedd36fe18688";
const DEFAULT_CREATED_BY_ID = "69aa7492ac4fedd36fe18692"; // uzaro-university@gmail.com

function getObjectIdFromEnvOrDefault(
  key: string,
  fallback: string
): mongoose.Types.ObjectId {
  const raw = process.env[key];
  if (raw && mongoose.isValidObjectId(raw)) return new mongoose.Types.ObjectId(raw);
  if (mongoose.isValidObjectId(fallback)) {
    return new mongoose.Types.ObjectId(fallback);
  }
  throw new Error(`Invalid fallback ObjectId for ${key}`);
}

async function main() {
  await connectDb();

  const organizationId = getObjectIdFromEnvOrDefault(
    "SEED_ORGANIZATION_ID",
    DEFAULT_ORGANIZATION_ID
  );
  const createdBy = getObjectIdFromEnvOrDefault(
    "SEED_CREATED_BY",
    DEFAULT_CREATED_BY_ID
  );

  const templates = [
    {
      organizationId,
      createdBy,
      name: "Quarterly Performance Review",
      description: "Quarterly review checklist for employees.",
      items: [
        {
          name: "Communication",
          description: "Clarity, responsiveness, and stakeholder updates.",
          itemType: "qualitative",
          weight: 2,
          dataSource: "manual",
        },
        {
          name: "On-time Delivery",
          description: "Delivers tasks on or before agreed deadlines.",
          itemType: "quantitative",
          targetValue: 95,
          threshold: 80,
          unit: "%",
          weight: 3,
          dataSource: "manual",
        },
        {
          name: "Required Certifications",
          description: "Has completed mandatory certifications for the period.",
          itemType: "certification",
          targetValue: true,
          weight: 1,
          dataSource: "lms",
        },
      ],
    },
    {
      organizationId,
      createdBy,
      name: "Probation Evaluation",
      description: "Checklist used during employee probation evaluation.",
      items: [
        {
          name: "Attendance",
          description: "Attendance and punctuality.",
          itemType: "quantitative",
          targetValue: 100,
          threshold: 90,
          unit: "%",
          weight: 2,
          dataSource: "manual",
        },
        {
          name: "Team Collaboration",
          description: "Works effectively with the team.",
          itemType: "qualitative",
          weight: 2,
          dataSource: "manual",
        },
      ],
    },
  ] as const;

  let upserted = 0;
  for (const t of templates) {
    await ChecklistTemplate.updateOne(
      { organizationId: t.organizationId, name: t.name, isDeleted: false },
      {
        $setOnInsert: {
          organizationId: t.organizationId,
          createdBy: t.createdBy,
          name: t.name,
          description: t.description,
          items: t.items,
          isDeleted: false,
          archive: { status: false, date: null },
        },
      },
      { upsert: true }
    );
    upserted += 1;
  }

  console.log(
    `Seed complete. Processed=${templates.length}, upsertAttempts=${upserted}, organizationId=${organizationId.toHexString()}`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

