const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  try {
    await pool.query(`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS stops_booking_at_midnight BOOLEAN DEFAULT FALSE;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(15), email VARCHAR(100) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS home_banners (id SERIAL PRIMARY KEY, image_url TEXT NOT NULL, bg_color VARCHAR(50) DEFAULT 'bg-slate-900', heading VARCHAR(255), paragraph TEXT, cta_text VARCHAR(100), cta_link VARCHAR(255), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
    await pool.query(`INSERT INTO home_banners (image_url, bg_color, heading, paragraph, cta_text, cta_link) SELECT 'https://example.com/default-banner.jpg', 'bg-slate-900', 'Welcome to Doctivo', 'Book your appointment today.', 'Book Now', '/doctors' WHERE NOT EXISTS (SELECT 1 FROM home_banners);`);
    console.log('Migration successful');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
