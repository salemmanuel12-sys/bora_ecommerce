const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  throw new Error('❌ .env not found at ' + envPath);
}

dotenv.config({ path: envPath });

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('❌ ENV NOT LOADED CORRECTLY');
}

console.log('✅ ENV LOADED OK');