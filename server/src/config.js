const fs = require('fs');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
} else if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/demo',
};

module.exports = { config };