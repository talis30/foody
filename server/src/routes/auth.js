const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create email transporter
const createTransporter = () => {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  return null;
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username
          ? 'Username already exists'
          : 'Email already registered'
      });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// @route   POST /api/auth/forgot-password
// @desc    Send new password to email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'נא להזין כתובת אימייל' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'לא נמצא משתמש עם כתובת אימייל זו' });
    }

    // Generate random password (8 characters)
    const newPassword = crypto.randomBytes(4).toString('hex');

    // Update user's password
    user.password = newPassword;
    await user.save();

    // Send email with new password
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        message: 'שירות האימייל אינו מוגדר. פנה למנהל המערכת.',
        notConfigured: true
      });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'סיסמה חדשה - Foody',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">🍽️ Foody</h2>
            <p style="color: #666;">שלום ${user.username},</p>
            <p style="color: #666;">קיבלנו בקשה לאיפוס סיסמה עבור החשבון שלך.</p>
            <p style="color: #666;">הסיסמה החדשה שלך היא:</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <code style="font-size: 24px; color: #333; letter-spacing: 2px;">${newPassword}</code>
            </div>
            <p style="color: #666;">מומלץ להחליף את הסיסמה לאחר ההתחברות.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
              הודעה זו נשלחה אוטומטית מ-Foody
            </p>
          </div>
        </body>
        </html>
      `
    });

    res.json({ message: 'סיסמה חדשה נשלחה לכתובת האימייל שלך' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'שגיאה בשליחת האימייל: ' + err.message });
  }
});

module.exports = router;
