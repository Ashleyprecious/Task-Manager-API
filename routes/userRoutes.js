// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');


router.post('/api/users/register', userController.registerUser);
router.post('/api/users/login', userController.loginUser);
router.post('/api/users/forgot-password', userController.forgotPassword);
router.post('/api/users/reset-password', userController.resetPassword);
router.post('/api/users/change-password', authenticateToken, userController.changePassword);
router.post('/api/users/delete', authenticateToken, userController.deleteAccount);
router.post('/api/users/update', authenticateToken, userController.updateUserProfile);


module.exports = router;