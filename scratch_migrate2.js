const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  try {
    // Delete/Cancel duplicates keeping the oldest one
    await pool.query(`
      WITH duplicates AS (
        SELECT appointment_id,
               ROW_NUMBER() OVER(
                 PARTITION BY doctor_id, appointment_date, appointment_time_slot
                 ORDER BY created_at ASC
               ) as row_num
        FROM appointments
        WHERE status != 'Cancelled'
      )
      UPDATE appointments
      SET status = 'Cancelled'
      WHERE appointment_id IN (
        SELECT appointment_id FROM duplicates WHERE row_num > 1
      );
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_appointment ON appointments (doctor_id, appointment_date, appointment_time_slot) WHERE status != 'Cancelled';`);
    console.log('Duplicates cancelled and Index created successfuly');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
