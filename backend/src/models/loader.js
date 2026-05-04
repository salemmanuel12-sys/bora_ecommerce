const { sequelize } = require('../config/db');
const initModels = require('./index');

let models = null;

function getModels() {
  if (!models) {
    models = initModels(sequelize);
    console.log('🔥 MODELOS INICIALIZADOS UNA SOLA VEZ');
  }
  return models;
}

module.exports = getModels();