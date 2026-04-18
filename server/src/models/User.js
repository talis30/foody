const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number
});

const Counter = mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Auto-increment userId before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.userId) {
    const counter = await Counter.findByIdAndUpdate(
      'userId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to initialize counter
userSchema.statics.initCounter = async function(startValue = 1001) {
  const existing = await Counter.findById('userId');
  if (!existing) {
    await Counter.create({ _id: 'userId', seq: startValue - 1 });
  }
};

module.exports = mongoose.model('User', userSchema);
