const pg = require('pg');
const { config } = require('./config');

const poolConfig = { connectionString: config.databaseUrl };
if (config.databaseUrl && !config.databaseUrl.includes('localhost')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}
const pool = new pg.Pool(poolConfig);
console.log('Database connection pool created with URL:', config.databaseUrl);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = { pool };