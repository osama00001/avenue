import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Admin ||
  mongoose.model("Admin", AdminSchema);
