import dotenv from 'dotenv';
dotenv.config();
import { query } from '../src/lib/db';

async function main() {
  try {
    const cols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendants'");
    console.log("Current attendants columns:", cols.rows.map(c => `${c.column_name} (${c.data_type})`));

    console.log("Ensuring required columns on attendants table...");
    await query(`
      ALTER TABLE attendants 
      ADD COLUMN IF NOT EXISTS pin VARCHAR(255),
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_checkin": true, "can_manage_queue": true, "can_view_symptoms": false}'::jsonb;
    `);

    // Also update any existing rows to have default pin '123456' if null
    await query(`
      UPDATE attendants SET pin = '123456' WHERE pin IS NULL;
    `);

    const updatedCols = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendants'");
    console.log("Updated attendants columns:", updatedCols.rows.map(c => `${c.column_name} (${c.data_type})`));
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

main();
