const { Sequelize } = require('sequelize');

const DB_TIMEZONE = process.env.DB_TIMEZONE || '-06:00';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    timezone: DB_TIMEZONE,
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
