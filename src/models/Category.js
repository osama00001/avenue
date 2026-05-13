/**
 * Category.js
 * Mongoose model for BIC subject codes
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  level: {
    type: Number,
    default: 0,
  },
  
  schemes: [{
    scheme: String,
    headingText: String,
    status: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

// Auto-set level based on code length before save
categorySchema.pre('save', function(next) {
  if (this.code) {
    this.level = this.code.length;
  }
  next();
});

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
