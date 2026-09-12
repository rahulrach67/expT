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
};

module.exports = { config };