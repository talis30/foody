const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      username: 'admin',
      email: 'admin@foody.local',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Role: admin');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
