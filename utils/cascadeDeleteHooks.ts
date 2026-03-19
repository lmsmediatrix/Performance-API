import mongoose, { Schema, UpdateQuery } from "mongoose";

/**
 * Adds a reusable pre-hook to remove references of a deleted document from related models.
 *
 * @param schema - The schema where the hook is applied
 * @param relatedModels - Array of related models and their corresponding fields to update
 */
const addCascadeDeleteHook = (
  schema: Schema,
  relatedModels: { modelName: string; field: string; isArray?: boolean }[]
) => {
  schema.pre("findOneAndDelete", async function (next) {
    const doc = await this.model.findOne(this.getQuery()).select("_id");
    if (!doc) return next();

    const docId = doc._id;

    await Promise.all(
      relatedModels.map(async ({ modelName, field, isArray = true }) => {
        const model = mongoose.model(modelName);
        const modelSchema = model.schema;
        const fieldType = modelSchema.path(field);
        const isFieldArray = isArray || (fieldType && Array.isArray(fieldType.options.type));

        if (isFieldArray) {
          return model.updateMany({}, { $pull: { [field]: docId } });
        } else {
          return model.updateMany({ [field]: docId }, { $set: { [field]: null } });
        }
      })
    );

    next();
  });

  schema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const docId = this._id;

    await Promise.all(
      relatedModels.map(async ({ modelName, field, isArray = true }) => {
        const model = mongoose.model(modelName);
        const modelSchema = model.schema;
        const fieldType = modelSchema.path(field);
        const isFieldArray = isArray || (fieldType && Array.isArray(fieldType.options.type));

        if (isFieldArray) {
          return model.updateMany({}, { $pull: { [field]: docId } });
        } else {
          return model.updateMany({ [field]: docId }, { $set: { [field]: null } });
        }
      })
    );

    next();
  });

  // Add hook for soft delete operations (when archive.status is set to true)
  schema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate() as UpdateQuery<any>;

    // Check if this update is a soft delete operation (setting archive.status to true)
    const isSoftDelete =
      update &&
      ((update.$set && update.$set["archive.status"] === true) ||
        update["archive.status"] === true);

    if (isSoftDelete) {
      const doc = await this.model.findOne(this.getQuery()).select("_id");
      if (!doc) return next();

      const docId = doc._id;

      await Promise.all(
        relatedModels.map(async ({ modelName, field, isArray = true }) => {
          const model = mongoose.model(modelName);
          const modelSchema = model.schema;
          const fieldType = modelSchema.path(field);
          const isFieldArray = isArray || (fieldType && Array.isArray(fieldType.options.type));

          if (isFieldArray) {
            return model.updateMany({}, { $pull: { [field]: docId } });
          } else {
            return model.updateMany({ [field]: docId }, { $set: { [field]: null } });
          }
        })
      );
    }

    next();
  });
};

export default addCascadeDeleteHook;
