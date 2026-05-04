const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  throw new Error('❌ .env not found at ' + envPath);
}

dotenv.config({ path: envPath });

console.log('✅ ENV LOADED OK');

function getEnv(name, minLength = 1) {
  const value = process.env[name];

  if (!value || value.length < minLength) {
    throw new Error(`❌ Missing env: ${name}`);
  }

  return value;
}

module.exports = { getEnv };