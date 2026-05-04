// src/config/db.js
const { Sequelize } = require('sequelize');
const { getEnv } = require('./env');

const sequelize = new Sequelize(
  getEnv('DB_NAME', 1),
  getEnv('DB_USER', 1),
  getEnv('DB_PASSWORD', 1),
  {
    host: getEnv('DB_HOST', 1),
    port: Number(getEnv('DB_PORT', 1)) || 3306,
    dialect: 'mysql',
    timezone: getEnv('DB_TIMEZONE', '-06:00'),
    logging: false,
  }
);

const testDatabaseConnection = async () => {
  await sequelize.authenticate();
  console.log('✅ DB conectada');
};

module.exports = {
  sequelize,
  testDatabaseConnection,
};