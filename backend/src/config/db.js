const { getEnv } = require('./env');
const { Sequelize } = require('sequelize');



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
  try {
    await sequelize.authenticate();
    console.log('Conexion a MySQL exitosa con Sequelize.');
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  testDatabaseConnection,
};
