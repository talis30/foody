const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all images for a recipe - Public
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const images = await Image.find({ recipeId: req.params.recipeId })
      .select('_id contentType filename order isMain createdAt')
      .sort({ order: 1 }); // Keep original order
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single image data - Public
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(image.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload images for a recipe (up to 3) - Protected
router.post('/recipe/:recipeId', protect, upload.array('images', 3), async (req, res) => {
  try {
    const { recipeId } = req.params;

    // Verify recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check ownership (admin can upload to any recipe)
    if (recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add images to this recipe' });
    }

    // Check existing images count
    const existingCount = await Image.countDocuments({ recipeId });
    if (existingCount + req.files.length > 3) {
      return res.status(400).json({
        message: `ניתן להעלות עד 3 תמונות. כרגע יש ${existingCount} תמונות.`
      });
    }

    // Check if there's already a main image
    const hasMain = await Image.exists({ recipeId, isMain: true });

    // Save each image
    const savedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const image = new Image({
        recipeId: recipeId,
        data: file.buffer,
        contentType: file.mimetype,
        filename: file.originalname,
        order: existingCount + i,
        isMain: !hasMain && i === 0 // First image becomes main if no main exists
      });
      const saved = await image.save();
      savedImages.push({
        _id: saved._id,
        contentType: saved.contentType,
        filename: saved.filename,
        order: saved.order,
        isMain: saved.isMain
      });
    }

    res.status(201).json(savedImages);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Set an image as main - Protected
router.patch('/:id/main', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Get associated recipe to check ownership
    const recipe = await Recipe.findById(image.recipeId);
    if (recipe && recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this image' });
    }

    // Unset all other images as main for this recipe
    await Image.updateMany(
      { recipeId: image.recipeId },
      { isMain: false }
    );

    // Set this image as main
    image.isMain = true;
    await image.save();

    res.json({ message: 'Image set as main', imageId: image._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete an image - Protected
router.delete('/:id', protect, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Get associated recipe to check ownership
    const recipe = await Recipe.findById(image.recipeId);
    if (recipe && recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }

    const wasMain = image.isMain;
    const recipeId = image.recipeId;

    await Image.findByIdAndDelete(req.params.id);

    // If we deleted the main image, set another one as main
    if (wasMain) {
      const nextImage = await Image.findOne({ recipeId }).sort({ order: 1 });
      if (nextImage) {
        nextImage.isMain = true;
        await nextImage.save();
      }
    }

    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete all images for a recipe - Protected
router.delete('/recipe/:recipeId', protect, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);

    if (recipe && recipe.userId &&
        recipe.userId !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete images from this recipe' });
    }

    await Image.deleteMany({ recipeId: req.params.recipeId });
    res.json({ message: 'All images deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
