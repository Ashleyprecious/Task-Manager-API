require('dotenv').config();
const { Sequelize } = require('sequelize');
const configs = require('./config.json');

const sequelize = new Sequelize(
	configs.database.database,
	configs.database.user,
	configs.database.password,
	{
		host: 'localhost',
		dialect: 'mysql',
		logging: (msg) => console.log(msg) // Logs raw SQL

	}
);

const db = sequelize;
const dbHelper = sequelize;

(async () => {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connection has been established successfully.');
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	}
})();

const { UserModel } = require('./models/User');
const user = UserModel(sequelize);

const { TaskModel } = require('./models/Task');
const task = TaskModel(sequelize);

const migrateDb = process.env.MIGRATE_DB || configs.database.migrate;
if (migrateDb === 'TRUE') {
	sequelize.sync({ alter: true }).then(() => {
		console.log(`All tables synced!`);
		process.exit(0);
	});
}

module.exports = {
    user,
    task,
	db,
    dbHelper,
};