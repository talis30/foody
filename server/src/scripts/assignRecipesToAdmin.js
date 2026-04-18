const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');
const Recipe = require('../models/Recipe');

const assignRecipes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      console.error('Admin user not found. Run seed:admin first.');
      process.exit(1);
    }

    const result = await Recipe.updateMany(
      { user: { $exists: false } },
      { $set: { user: admin._id } }
    );

    console.log(`Assigned ${result.modifiedCount} recipes to admin user`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

assignRecipes();
