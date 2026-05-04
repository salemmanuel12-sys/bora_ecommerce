const path = require('path');

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env')
});

function getEnv(key, defaultValue = undefined, minLength = 0) {
  const value = process.env[key];

  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`❌ Missing env: ${key}`);
  }

  if (minLength && value.length < minLength) {
    throw new Error(`❌ Env too short: ${key}`);
  }

  return value;
}

module.exports = { getEnv };