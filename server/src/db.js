const pg = require('pg');
const { config } = require('./config');

const pool = new pg.Pool({ connectionString: config.databaseUrl });
console.log('Database connection pool created with URL:', config.databaseUrl);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = { pool };