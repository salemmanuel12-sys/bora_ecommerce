const dotenv = require('dotenv');
const path = require('path');

// Cargar SIEMPRE .env desde raíz del backend
dotenv.config({
  path: path.resolve(__dirname, '../../../.env')
});

function getEnv(name, minLength = 1) {
  const value = process.env[name];

  if (!value || value.length < minLength) {
    throw new Error(`❌ Missing env: ${name} (min length ${minLength})`);
  }

  return value;
}

module.exports = {
  getEnv
};