import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,

    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    role: { type: String, default: "user" },

    status: {
      type: Boolean,
      default: true,
    },

    // ---------- SOFT DELETE ----------
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    resetToken: String,
    resetTokenExpiry: Date,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
