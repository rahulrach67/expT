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
  throw new Error('Node.js 20.12 or newer is required to load .env files.');
}

const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-change-me',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/demo',
};

module.exports = { config };