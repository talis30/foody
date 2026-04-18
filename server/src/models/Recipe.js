const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  spices: [{
    name: {
      type: String,
      trim: true
    },
    amount: {
      type: String,
      enum: ['רבע כפית', 'חצי כפית', 'כפית', 'כפית וחצי', '2 כפיות'],
      default: 'כפית'
    }
  }],
  instructions: {
    type: String
  },
  stages: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  cookTime: {
    type: Number,
    min: 0
  },
  servings: {
    type: Number,
    min: 1
  },
  category: {
    type: String,
    trim: true
  },
  origin: {
    type: String,
    trim: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5
  },
  spiciness: {
    type: Number,
    min: 1,
    max: 5
  },
  image: {
    type: String
  },
  userId: {
    type: Number,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isVegetarian: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema);
