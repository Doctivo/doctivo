const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_IFDTsOb6PUB1@ep-floral-dream-aiqni3bk-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connected to DB successfully:', res.rows);
  }
  pool.end();
});
