const jwt = require('jsonwebtoken');
const { user } = require('../db');

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

    // Block non-admin users from accessing admin routes
    

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