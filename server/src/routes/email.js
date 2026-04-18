const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter - configure with your SMTP settings
const createTransporter = () => {
  // Check if SMTP settings are configured
  if (!process.env.SMTP_HOST && !process.env.GMAIL_USER) {
    return null;
  }

  // Gmail configuration
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send recipe as gift card email
router.post('/send-gift', async (req, res) => {
  try {
    const { to, recipe, message } = req.body;

    if (!to || !recipe) {
      return res.status(400).json({ message: 'Missing required fields: to, recipe' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        message: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env file',
        notConfigured: true
      });
    }

    // Build HTML email
    const html = buildGiftCardHtml(recipe, message);

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@foody.app',
      to: to,
      subject: `מתכון במתנה: ${recipe.title}`,
      html: html
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email: ' + err.message });
  }
});

// Build HTML for the gift card email
function buildGiftCardHtml(recipe, message) {
  const spicesHtml = recipe.spices?.length > 0
    ? `<div style="flex: 0 0 auto; min-width: 120px;">
        <h3 style="font-size: 13px; font-weight: bold; color: #8b4513; margin: 0 0 6px 0;">תבלינים</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${recipe.spices.map(s => `<li style="padding: 2px 0; font-size: 11px;">• ${s.name} - ${s.amount}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const stagesHtml = recipe.stages?.length > 0
    ? recipe.stages.map((stage, i) => `
        <div style="margin-bottom: 10px;">
          ${(stage.title || recipe.stages.length > 1) ? `<strong style="color: #8b4513;">${stage.title ? stage.title + ':' : 'שלב ' + (i + 1) + ':'}</strong>` : ''}
          <span style="white-space: pre-line;">${stage.description || ''}</span>
        </div>
      `).join('')
    : (recipe.instructions || '');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <div style="max-width: 400px; margin: 0 auto; background: linear-gradient(180deg, #f5e6c8 0%, #e8d4a8 100%); border-radius: 12px; padding: 25px; color: #4a3728; font-size: 13px; line-height: 1.6; direction: rtl; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">

    <div style="text-align: center; font-size: 16px; font-weight: bold; color: #8b4513; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px dashed #c4a77d;">
      מתכון במתנה
    </div>

    <h1 style="text-align: center; font-size: 22px; font-weight: bold; color: #3d2914; margin: 0 0 10px 0;">
      ${recipe.title}
    </h1>

    ${recipe.description ? `<p style="text-align: center; color: #6b5344; font-style: italic; margin: 0 0 15px 0; font-size: 12px;">${recipe.description}</p>` : ''}

    <div style="text-align: center; font-size: 11px; color: #7d6b5d; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px dashed #c4a77d;">
      ${recipe.origin ? `<span style="margin: 0 8px;">🌍 ${recipe.origin}</span>` : ''}
      ${recipe.cookTime ? `<span style="margin: 0 8px;">⏱️ ${recipe.cookTime} דק׳</span>` : ''}
      ${recipe.servings ? `<span style="margin: 0 8px;">🍽️ ${recipe.servings} מנות</span>` : ''}
      ${recipe.difficulty ? `<span style="margin: 0 8px;">${'💪'.repeat(recipe.difficulty)}</span>` : ''}
    </div>

    <table style="width: 100%; margin-bottom: 15px;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align: top; padding-left: 15px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #8b4513; margin: 0 0 8px 0;">מצרכים</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${recipe.ingredients?.map(ing => `<li style="padding: 3px 0; font-size: 12px;">• ${ing}</li>`).join('') || ''}
          </ul>
        </td>
        ${recipe.spices?.length > 0 ? `
        <td style="vertical-align: top; width: 140px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #8b4513; margin: 0 0 8px 0;">תבלינים</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${recipe.spices.map(s => `<li style="padding: 3px 0; font-size: 12px;">• ${s.name} - ${s.amount}</li>`).join('')}
          </ul>
        </td>
        ` : ''}
      </tr>
    </table>

    <div style="margin-bottom: 15px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #8b4513; margin: 0 0 8px 0;">הוראות הכנה</h3>
      <div style="font-size: 12px;">
        ${stagesHtml}
      </div>
    </div>

    ${message ? `
    <div style="text-align: center; font-style: italic; color: #6b5344; padding: 12px; margin-top: 15px; border-top: 2px dashed #c4a77d; font-size: 14px;">
      "${message}"
    </div>
    ` : ''}

    <div style="text-align: center; font-size: 18px; font-weight: bold; color: #8b4513; margin-top: 15px; padding-top: 12px; border-top: 2px dashed #c4a77d;">
      בתיאבון! 🍽️
    </div>

  </div>

  <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
    נשלח באמצעות Foody - אפליקציית המתכונים
  </p>
</body>
</html>`;
}

module.exports = router;
