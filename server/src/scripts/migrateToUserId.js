const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Create/update counter for userId starting at 1000
    await db.collection('counters').updateOne(
      { _id: 'userId' },
      { $set: { seq: 1000 } },
      { upsert: true }
    );
    console.log('Counter initialized at 1000');

    // 2. Update admin user to have userId = 1001
    const adminResult = await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { userId: 1001 } }
    );
    console.log(`Admin user updated: ${adminResult.modifiedCount > 0 ? 'yes' : 'already had userId or not found'}`);

    // Update counter to 1001 since we used it for admin
    await db.collection('counters').updateOne(
      { _id: 'userId' },
      { $set: { seq: 1001 } }
    );

    // 3. Get admin's ObjectId to find their recipes
    const admin = await db.collection('users').findOne({ username: 'admin' });
    if (admin) {
      // Update all recipes that have user = admin's ObjectId to use userId = 1001
      const recipeResult = await db.collection('recipes').updateMany(
        { user: admin._id },
        { $set: { userId: 1001 }, $unset: { user: '' } }
      );
      console.log(`Recipes updated: ${recipeResult.modifiedCount}`);

      // Also update recipes that don't have any user to use admin
      const orphanResult = await db.collection('recipes').updateMany(
        { user: { $exists: false }, userId: { $exists: false } },
        { $set: { userId: 1001 } }
      );
      console.log(`Orphan recipes assigned to admin: ${orphanResult.modifiedCount}`);
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

migrate();
