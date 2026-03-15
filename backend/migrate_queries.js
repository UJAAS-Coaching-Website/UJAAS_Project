import { pool } from './src/db/index.js';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add course_id column referencing landing_courses
        await client.query(
            'ALTER TABLE prospect_queries ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES landing_courses(id) ON DELETE SET NULL'
        );

        // 2. Populate course_id from existing course name text
        const rows = await client.query('SELECT id, course FROM prospect_queries WHERE course IS NOT NULL AND course_id IS NULL');
        for (const row of rows.rows) {
            const match = await client.query('SELECT id FROM landing_courses WHERE name = $1 LIMIT 1', [row.course]);
            if (match.rows.length > 0) {
                await client.query('UPDATE prospect_queries SET course_id = $1 WHERE id = $2', [match.rows[0].id, row.id]);
                console.log('Mapped:', row.course, '->', match.rows[0].id);
            } else {
                console.log('No match for course:', row.course);
            }
        }

        // 3. Drop old course text column
        await client.query('ALTER TABLE prospect_queries DROP COLUMN IF EXISTS course');

        await client.query('COMMIT');
        console.log('Migration done: prospect_queries now uses course_id FK');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
