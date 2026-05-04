const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

function getEnv(key, minLength = 0) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`❌ Missing env: ${key}`);
  }

  if (minLength && value.length < minLength) {
    throw new Error(`❌ Missing env: ${key} (min length ${minLength})`);
  }

  return value;
}

module.exports = { getEnv };