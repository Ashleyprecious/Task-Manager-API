const { Router } = require('express');
const router = Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/api/tasks', authenticateToken, taskController.addTask);
router.post('/api/get-tasks', authenticateToken, taskController.getAllTasks);
router.post('/api/tasks/:id', authenticateToken, taskController.updateTask);
router.post('/api/delete-tasks/:id', authenticateToken, taskController.deleteTask);
router.post('/api/restore-tasks/:id', authenticateToken, taskController.restoreTask);

module.exports = router;