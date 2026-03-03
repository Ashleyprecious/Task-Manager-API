// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');

router.post('/api/users/register', userController.registerUser);
router.post('/api/users/login', userController.loginUser);
router.post('/api/users/forgot-password', userController.forgotPassword);
router.post('/api/users/reset-password', userController.resetPassword);
router.post('/api/users/change-password', userController.changePassword);
router.delete('/api/users/delete-account', userController.deleteAccount);
router.post('/api/users/update', userController.updateUserProfile);


module.exports = router;