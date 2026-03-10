const { Router } = require('express');
const router = Router();
const adminController = require('../controllers/adminController');
const { authenticateTokenAdmin } = require('../middlewares/authMiddleware');

// ─── All routes here are protected by authenticateTokenAdmin ───────────────────────
// authenticateTokenAdmin verifies the JWT AND checks user_type === 'admin'

// Dashboard stats (single call for all metrics)
router.post('/api/admin/stats', authenticateTokenAdmin, adminController.getStats);

// Users
router.post('/api/admin/users',          authenticateTokenAdmin, adminController.getAllUsers);
router.post('/api/admin/users/online',   authenticateTokenAdmin, adminController.getOnlineUsers);
router.post('/api/admin/users/deleted',  authenticateTokenAdmin , adminController.getDeletedUsers);

// Per-user detail (drawer in the admin panel)
router.post('/api/admin/users/:id/tasks',    authenticateTokenAdmin, adminController.getUserTasks);
router.post('/api/admin/users/:id/activity', authenticateTokenAdmin, adminController.getUserActivity);

// Admin-initiated user deletion
router.post('/api/admin/users/:id/delete', authenticateTokenAdmin, adminController.deleteUserById);

// Global task list
router.post('/api/admin/tasks', authenticateTokenAdmin, adminController.getAllTasks);

// Global activity log
router.post('/api/admin/activity', authenticateTokenAdmin, adminController.getActivityLog);

module.exports = router;