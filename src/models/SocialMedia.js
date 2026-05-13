import mongoose from "mongoose";

/**
 * ===============================
 * SINGLE SOCIAL LINK
 * ===============================
 */
const SocialLinkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      // ex: faFacebook, faInstagram
      type: String,
      default: "",
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * ===============================
 * CONFIG DOCUMENT
 * ===============================
 */
const SocialMediaSchema = new mongoose.Schema(
  {
    links: {
      type: [SocialLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SocialMedia ||
  mongoose.model("SocialMedia", SocialMediaSchema);
