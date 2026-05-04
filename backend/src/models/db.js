const { sequelize } = require('../config/db');
const initModels = require('./index');

const db = initModels(sequelize);
console.log('🔥 MODELOS INICIALIZADOS UNA SOLA VEZ');

module.exports = db;
