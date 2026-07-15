import { query } from './src/lib/db';

async function run() {
  try {
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='is_deleted') THEN 
          ALTER TABLE patients ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
    console.log("Migration successful");
  } catch (e) {
    console.error(e);
  }
}

run();
