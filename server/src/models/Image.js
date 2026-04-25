const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  filename: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  isMain: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries by recipe
imageSchema.index({ recipeId: 1 });

module.exports = mongoose.model('Image', imageSchema);
