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

/**
 * Server application configuration loaded from environment variables (.env).
 */
const config = {
  /** Express server port (defaults to 3000) */
  port: process.env.PORT || 3000,
  /** JWT secret key for signing and verifying tokens */
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  /** JWT default token expiration time string (e.g. '8h', '1d', '60m') */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  /** PostgreSQL connection URI */
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/demo',
};

module.exports = { config };
