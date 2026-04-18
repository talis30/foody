const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { protect, optionalAuth } = require('../middleware/auth');

// Get all recipes (with optional search) - Public
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { origin: { $regex: search, $options: 'i' } },
          { ingredients: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one recipe - Public (with view counter)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Increment view count and get updated recipe
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if user is owner or admin
    const isOwnerOrAdmin = req.user && (
      req.user.userId === recipe.userId ||
      req.user.role === 'admin'
    );

    // Convert to object and remove views if not owner/admin
    const recipeObj = recipe.toObject();
    if (!isOwnerOrAdmin) {
      delete recipeObj.views;
    }

    res.json(recipeObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create recipe - Protected
router.post('/', protect, async (req, res) => {
  const recipe = new Recipe({
    title: req.body.title,
    description: req.body.description,
    ingredients: req.body.ingredients,
    spices: req.body.spices,
    instructions: req.body.instructions,
    stages: req.body.stages,
    cookTime: req.body.cookTime,
    servings: req.body.servings,
    category: req.body.category,
    origin: req.body.origin,
    difficulty: req.body.difficulty,
    spiciness: req.body.spiciness,
    image: req.body.image,
    userId: req.user.userId
  });

  try {
    const newRecipe = await recipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update recipe - Protected + ownership check
router.put('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check ownership (admin can edit any recipe)
    if (recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedRecipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete recipe - Protected + ownership check
router.delete('/:id', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check ownership (admin can delete any recipe)
    if (recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
