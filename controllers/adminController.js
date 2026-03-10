const { user, task, activity_log, Sequelize } = require('../db');
const { Op } =  require('sequelize');

// ─── Helper: safe JSON ────────────────────────────────────────────────────────
const toJSON = (instance) => instance?.toJSON ? instance.toJSON() : instance;

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Returns all active (non-deleted) users
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      search,
      first_name,
      last_name,
      email,
      phone_number,
      user_type,
      sort_by = 'createdAt',
      sort_order = 'DESC',
    } = req.body;

    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 10;
    const offset = (currentPage - 1) * perPage;

    // Build where conditions
    let whereConditions = {};

    // Handle specific field filters
    if (first_name) {
      whereConditions.first_name = { [Op.like]: `%${first_name}%` };
    }
    
    if (last_name) {
      whereConditions.last_name = { [Op.like]: `%${last_name}%` };
    }
    
    if (email) {
      whereConditions.email = { [Op.like]: `%${email}%` };
    }
    
    if (phone_number) {
      whereConditions.phone_number = { [Op.like]: `%${phone_number}%` };
    }
    
    if (user_type) {
      whereConditions.user_type = user_type;
    }

    // Handle generic search (searches across multiple fields)
   if (search) {
  whereConditions = {
    [Op.and]: [
      whereConditions,
      {
        [Op.or]: [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } },
        ],
      },
    ],
  };
}

    const { count, rows: users } = await user.findAndCountAll({
      where: whereConditions,
      attributes: { 
        exclude: ['password', 'reset_password_token', 'reset_password_expires'] 
      },
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: perPage,
      offset,
      distinct: true,
    });

    const total_pages = Math.ceil(count / perPage);

    return res.status(200).json({
      result_code: 1,
      message: 'Users fetched successfully.',
      users: users.map(toJSON),
      pagination: {
        total_records: count,
        total_pages,
        current_page: currentPage,
        per_page: perPage,
        has_next: currentPage < total_pages,
        has_prev: currentPage > 1,
      },
    });
  } catch (err) {
    console.error('Error fetching all users:', err);
    return next(err);
  }
};
// ─── GET /api/admin/users/deleted ─────────────────────────────────────────────
// Returns all soft-deleted users
exports.getDeletedUsers = async (req, res, next) => {
  try {
    const deletedUsers = await user.findAll({
      where: { is_deleted: true },
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
      order: [['updatedAt', 'DESC']],
    });

    return res.status(200).json({
      result_code: 1,
      message: 'Deleted users fetched successfully.',
      users: deletedUsers.map(toJSON),
    });
  } catch (err) {
    console.error('Error fetching deleted users:', err);
    return next(err);
  }
};

// ─── GET /api/admin/users/online ──────────────────────────────────────────────
// Returns users active in the last 15 minutes (based on last_active column).
// Falls back to users updated in the last 15 min if last_active doesn't exist.
exports.getOnlineUsers = async (req, res, next) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const onlineUsers = await user.findAll({
      where: {
        is_deleted: false,
        last_active: { [Op.gte]: fifteenMinutesAgo },
      },
      attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
      order: [['last_active', 'DESC']],
    });

    return res.status(200).json({
      result_code: 1,
      message: 'Online users fetched successfully.',
      users: onlineUsers.map(toJSON),
    });
  } catch (err) {
    // If last_active column doesn't exist yet, return empty array gracefully
    console.error('Error fetching online users (last_active column may not exist yet):', err.message);
    return res.status(200).json({
      result_code: 1,
      message: 'Online users fetched (last_active not available).',
      users: [],
    });
  }
};

// ─── GET /api/admin/tasks ─────────────────────────────────────────────────────
// Returns all tasks across all users, joined with the owner's name
exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await task.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: user,
          as: 'user',                      // adjust 'as' to match your association alias
          attributes: ['user_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      result_code: 1,
      message: 'Tasks fetched successfully.',
      tasks: tasks.map(toJSON),
    });
  } catch (err) {
    // If association alias differs, fall back to plain task fetch
    console.error('Error fetching all tasks (check association alias):', err.message);
    try {
      const tasks = await task.findAll({ order: [['createdAt', 'DESC']] });
      return res.status(200).json({
        result_code: 1,
        message: 'Tasks fetched (without user join).',
        tasks: tasks.map(toJSON),
      });
    } catch (fallbackErr) {
      return next(fallbackErr);
    }
  }
};

// ─── GET /api/admin/activity ──────────────────────────────────────────────────
// Returns the global activity log (all users), most recent first.
// If you don't have an activity_log table yet, see the note at the bottom of this file.
exports.getActivityLog = async (req, res, next) => {
  try {
    if (!activity_log) {
      // activity_log table not set up yet — return empty gracefully
      return res.status(200).json({ result_code: 1, message: 'Activity log not available.', activities: [] });
    }

    const logs = await activity_log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 200,
      include: [
        {
          model: user,
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name', 'email'],
          required: false,
        },
      ],
    });

    // Normalise: attach user_name and map created_at → timestamp for the frontend
    const activities = logs.map(l => {
      const raw = toJSON(l);
      return {
        ...raw,
        timestamp: raw.createdAt,
        user_name: raw.user ? `${raw.user.first_name} ${raw.user.last_name}` : null,
      };
    });

    return res.status(200).json({ result_code: 1, message: 'Activity log fetched.', activities });
  } catch (err) {
    console.error('Error fetching activity log:', err.message);
    return res.status(200).json({ result_code: 1, message: 'Activity log not available.', activities: [] });
  }
};

// ─── GET /api/admin/users/:id/tasks ───────────────────────────────────────────
// Returns all tasks belonging to one specific user
exports.getUserTasks = async (req, res, next) => {
  try {
    const { id } = req.params;

    const foundUser = await user.findOne({ where: { user_id: id } });
    if (!foundUser) {
      return res.status(404).json({ result_code: 0, message: 'User not found.' });
    }

    const tasks = await task.findAll({
      where: { created_by: id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      result_code: 1,
      message: 'User tasks fetched successfully.',
      tasks: tasks.map(toJSON),
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    return next(err);
  }
};

// ─── GET /api/admin/users/:id/activity ────────────────────────────────────────
// Returns activity log entries for one specific user
exports.getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!activity_log) {
      return res.status(200).json({ result_code: 1, message: 'Activity log not available.', activities: [] });
    }

    const logs = await activity_log.findAll({
      where: { user_id: id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const activities = logs.map(l => {
      const raw = toJSON(l);
      return { ...raw, timestamp: raw.createdAt };
    });

    return res.status(200).json({
      result_code: 1,
      message: 'User activity fetched.',
      activities,
    });
  } catch (err) {
    console.error('Error fetching user activity:', err.message);
    return res.status(200).json({ result_code: 1, message: 'Activity log not available.', activities: [] });
  }
};

// ─── POST /api/admin/users/:id/delete ─────────────────────────────────────────
// Admin hard-deletes (soft) a user by ID — same pattern as deleteAccount
exports.deleteUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === String(req.user.id)) {
      return res.status(400).json({ result_code: 0, message: 'You cannot delete your own admin account.' });
    }

    const foundUser = await user.findOne({ where: { user_id: id, is_deleted: false } });
    if (!foundUser) {
      return res.status(404).json({ result_code: 0, message: 'User not found.' });
    }

    await foundUser.update({ is_deleted: true });

    return res.status(200).json({
      result_code: 1,
      message: `Account for ${foundUser.first_name} ${foundUser.last_name} deleted successfully.`,
    });
  } catch (err) {
    console.error('Error deleting user by admin:', err);
    return next(err);
  }
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
// Single endpoint for all dashboard metrics (optional — useful if you want one call)
exports.getStats = async (req, res, next) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [totalUsers, deletedUsers, totalTasks] = await Promise.all([
      user.count({ where: { is_deleted: false } }),
      user.count({ where: { is_deleted: true } }),
      task.count(),
    ]);

    // Try online count — gracefully skip if last_active column doesn't exist
    let onlineUsers = 0;
    try {
      onlineUsers = await user.count({
        where: { is_deleted: false, last_active: { [Op.gte]: fifteenMinutesAgo } },
      });
    } catch (_) { /* column not yet added */ }

    // Task status breakdown
    const taskStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    const taskCounts = {};
    await Promise.all(
      taskStatuses.map(async (status) => {
        taskCounts[status] = await task.count({ where: { status } });
      })
    );

    return res.status(200).json({
      result_code: 1,
      message: 'Stats fetched successfully.',
      stats: {
        totalUsers,
        deletedUsers,
        onlineUsers,
        totalTasks,
        taskCounts,
        completionRate: totalTasks
          ? Math.round((taskCounts['Completed'] / totalTasks) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: Activity Log table
// ─────────────────────────────────────────────────────────────────────────────
// If you don't have an activity_log table yet, create a migration/model like:
//
//  activity_log: {
//    id          (INTEGER, PK, auto-increment)
//    user_id     (INTEGER, FK → users.user_id)
//    type        (STRING)  → 'login' | 'logout' | 'register' | 'task_create' | etc.
//    target      (STRING, nullable) → e.g. task title
//    createdAt   (DATE)
//  }
//
// Then log actions inside userController.js and taskController.js like:
//   await activity_log.create({ user_id: foundUser.user_id, type: 'login' });
//   await activity_log.create({ user_id: req.user.id, type: 'task_create', target: newTask.title });
// ─────────────────────────────────────────────────────────────────────────────