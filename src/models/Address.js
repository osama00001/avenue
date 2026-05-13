import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    // OWNER
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // LABEL (Home / Office etc.)
    label: {
      type: String,
      default: "Home",
    },

    // CONTACT
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    // ADDRESS FIELDS
    line1: {
      type: String,
      required: true,
    },

    line2: String,

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    postalCode: {
      type: String,
      required: true,
      index: true,
    },

    country: {
      type: String,
      required: true,
      default: "UK",
    },

    // DEFAULT FLAG
    isDefault: {
      type: Boolean,
      default: false,
    },

    // SOFT DELETE
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * ===========================================
 * ENSURE ONLY ONE DEFAULT ADDRESS PER USER
 * ===========================================
 */
AddressSchema.pre("save", async function () {
  // Only run when default flag changed
  if (!this.isModified("isDefault")) return;

  if (this.isDefault) {
    await mongoose.models.Address.updateMany(
      {
        user: this.user,
        _id: { $ne: this._id }, // don't unset self
      },
      { $set: { isDefault: false } }
    );
  }
});

export default mongoose.models.Address ||
  mongoose.model("Address", AddressSchema);
