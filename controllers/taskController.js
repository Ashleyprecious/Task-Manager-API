const { task } = require('../db');
const { Op } = require('sequelize');

// Controller for handling task-related operations
module.exports = {
    // Add a new task
    addTask: async (req, res) => {
        try {
            const { title, description, status } = req.body;
            // add created_by field to track which user created the task
            const created_by = req.user.id; 
            
            // Assuming user info is available in req.user
            const newTask = await task.create({ title, description, status, created_by });
            res.status(200).json({ result_code: 1, message: 'Task added successfully', task: newTask });
        } catch (error) {
            console.error('Error adding task:', error);
            res.status(500).json({ result_code: 0, message: 'Failed to add task' });
        } 
    },


    // Get all tasks
    getAllTasks: async (req, res) => {
        try {
            const tasks = await task.findAll({ where: { is_deleted: false } });
            res.status(200).json({ result_code: 1, message: 'Tasks retrieved successfully', tasks });
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            res.status(500).json({ result_code: 0, message: 'Failed to retrieve tasks' });
        }
    },

    // Update a task
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, status } = req.body;
            const modified_by = req.user.id; // Track the user who modified the task

            
            const [updated] = await task.update({ title, description, status, modified_by }, { where: { id, is_deleted: false } });
            if (updated) {
                const updatedTask = await task.findOne({ where: { id } });
                res.status(200).json({ result_code: 1, message: 'Task updated successfully', task: updatedTask });
            } else {
                res.status(404).json({ result_code: 0, message: 'Task not found' });
            }
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(500).json({ result_code: 0, message: 'Failed to update task' });
        }
    },
    

    // Soft delete a task
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;
            const [deleted] = await task.update({ is_deleted: true }, { where: { id, is_deleted: false } });
            if (deleted) {
                res.status(200).json({ result_code: 1, message: 'Task deleted successfully' });
            } else {
                res.status(404).json({ result_code: 0, message: 'Task not found' });
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            res.status(500).json({ result_code: 0, message: 'Failed to delete task' });
        }
    },

    //restore a soft-deleted task
    restoreTask: async (req, res) => {
        try {
            const { id } = req.params;
            const [restored] = await task.update({ is_deleted: false }, { where: { id, is_deleted: true } });
            if (restored) {
                const restoredTask = await task.findOne({ where: { id } });
                res.status(200).json({ result_code: 1, message: 'Task restored successfully', task: restoredTask });
            } else {
                res.status(404).json({ result_code: 0, message: 'Task not found or not deleted' });
            }
        } catch (error) {
            console.error('Error restoring task:', error);
            res.status(500).json({ result_code: 0, message: 'Failed to restore task' });
        }
    },  
};

