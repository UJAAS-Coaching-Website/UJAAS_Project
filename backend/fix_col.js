import { pool } from './src/db/index.js';

async function fixCol() {
  try {
    // Rename column from correct_ans to correct_answer if it exists
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns 
                  WHERE table_name='questions' AND column_name='correct_ans') THEN
          ALTER TABLE questions RENAME COLUMN correct_ans TO correct_answer;
        END IF;
      END $$;
    `);
    console.log('Column correct_ans renamed to correct_answer successfully.');
    process.exit(0);
  } catch(e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}
fixCol();
