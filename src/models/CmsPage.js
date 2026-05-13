import mongoose from "mongoose";

/**
 * ===============================
 * BLOCK SUBDOCUMENT
 * ===============================
 */
const BlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

/**
 * ===============================
 * CMS PAGE SCHEMA
 * ===============================
 */
const CmsPageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * ⭐ NEW FIELD
     * Level (for hierarchy / nav / priority / etc.)
     */
    level: {
      type: Number,
      default: 0,
      index: true,
    },

    blocks: {
      type: [BlockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent model overwrite in dev hot reload
 */
export default mongoose.models.CmsPage ||
  mongoose.model("CmsPage", CmsPageSchema);
