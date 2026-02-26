const { Sequelize } = require("sequelize");
const configs = require("../config.json");

const args = process.argv;
//get third argument
const currentEnv = args[2];
module.exports.dbfix = async (req, res, next) => {
  try {
    const sequelize = new Sequelize(
      currentEnv !== "live"
        ? configs.database.database
        : configs.livedatabase.database,
      currentEnv !== "live" ? configs.database.user : configs.livedatabase.user,
      currentEnv !== "live"
        ? configs.database.password
        : configs.livedatabase.password,
      {
        host: "localhost",
        dialect: "mysql" /* 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
      }
    );

    // Import all models from the current backend structure
    const { UserModel } = require("../models/User");
    const { TaskModel } = require("../models/Task");

    // Initialize models
    const user = UserModel(sequelize);
    const task = TaskModel(sequelize);

    await sequelize.authenticate();

    // Define associations (as they are in db.js)

    sequelize
      .sync({
        alter: true,
      })
      .then(() => {
        res.writeHead(200, {
          "Content-Type": "text/plain",
        });
        // Write the word to the response
        return res.end(req.get("host") + " DB Fixed.");
      });
    module.exports = {
      user,
      sequelize, // Export sequelize instance
    };
  } catch (err) {
    console.log(err);
    return next(err);
  }
};
