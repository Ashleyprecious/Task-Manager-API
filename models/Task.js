const { DataTypes } = require('sequelize');

const TaskModel = (sequelize) => {
  return sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The title of the task',
    },
    detail: {
      type: DataTypes.TEXT,
      comment: 'Detailed description of the task',
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium',
      comment: 'Task priority level',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Cancelled'),
      defaultValue: 'Pending',
      comment: 'Current status of the task',
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Optional due date for the task',
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Soft delete flag',
    },
    modified_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID of the last modifier',
    },
    modified_on: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last modification',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User ID of the creator',
    },
    
  }, {
    timestamps: true, // createdAt and updatedAt
    tableName: 'tasks',
  });
};

module.exports = { TaskModel };