const { sequelize } = require('../config/db');
const initModels = require('./index');

let dbInstance = null;

if (!dbInstance) {
  dbInstance = initModels(sequelize);
  console.log('🔥 MODELOS INICIALIZADOS UNA SOLA VEZ');
}

module.exports = dbInstance;