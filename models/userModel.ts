import mongoose, { Schema } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  role?: string;
  subrole?: string;
  person?: unknown;
  directTo?: mongoose.Types.ObjectId | string;
  organizationId?: mongoose.Types.ObjectId | string;
  archive?: {
    status?: boolean;
    date?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema({}, { strict: false, timestamps: true, collection: "users" });

const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
