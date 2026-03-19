const UserSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, required: true, unique: true }, 
  password: { type: String }, 
  phone: { type: String },
  date_of_birth: { type: Date },
  gender: { type: String, enum: ["male", "female", "other"] },                                 // enums config for gender
  avatar: { type: String },
  role: { type: String, enum: ["superAdmin","admin", "teacher", "student"], required: true }, // enums config for role
  status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },     // enums config for status
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" }, 

},{timestamps: true});

module.exports = mongoose.model("User", UserSchema);