const jwt = require('jsonwebtoken');
const { user } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Admin Authentication Middleware ─────────────────────────────────────────
// Extends the existing authenticateToken pattern to also verify user_type === 'admin'

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ result_code: 0, message: 'Authentication token required.' });
  }

  jwt.verify(token, process.env.AUTH_SECRET || 'secretEncryptionKey', async (err, userPayload) => {
    if (err) {
      return res.status(403).json({ result_code: 0, message: 'Invalid or expired token.' });
    }

    const foundUser = await user.findOne({ where: { user_id: userPayload.user_id, is_deleted: false } });

    if (!foundUser) {
      return res.status(403).json({ result_code: 0, message: 'User not found or deleted.' });
    }

    req.user = { id: foundUser.user_id, user_type: foundUser.user_type };
    next();
  });
};

exports.authenticateTokenAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ result_code: 0, message: 'Authentication token required.' });
  }

  jwt.verify(token, process.env.AUTH_SECRET || 'secretEncryptionKey', async (err, userPayload) => {
    if (err) {
      return res.status(403).json({ result_code: 0, message: 'Invalid or expired token.' });
    }

    const foundUser = await user.findOne({ where: { user_id: userPayload.user_id, is_deleted: false } });

    if (!foundUser) {
      return res.status(403).json({ result_code: 0, message: 'User not found or deleted.' });
    }

    // Block non-admin users from accessing admin routes
    if (foundUser.user_type !== 'admin') {
      return res.status(403).json({ result_code: 0, message: 'Access denied. Admins only.' });
    }

    req.user = { id: foundUser.user_id, user_type: foundUser.user_type };
    next();
  });
};

// ─── File Upload Configuration ─────────────────────────────────────────────

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Get user ID from request (set by authenticateToken middleware)
    const userId = req.user?.id || 'unknown';
    // Create unique filename: userid-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Export the upload middleware
exports.upload = upload;

