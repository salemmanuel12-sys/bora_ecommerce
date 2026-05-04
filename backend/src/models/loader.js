const { sequelize } = require('../config/db');
const initModels = require('./index');

module.exports = initModels(sequelize);