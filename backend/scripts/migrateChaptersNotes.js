
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coach_db'
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Drop the old chapters table (batch_id was integer, needs to be uuid)
        console.log('Dropping old chapters table...');
        await client.query('DROP TABLE IF EXISTS chapters CASCADE');

        // 2. Recreate the chapters table with correct types
        console.log('Creating chapters table with uuid batch_id...');
        await client.query(`
            CREATE TABLE chapters (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
                subject_name TEXT NOT NULL,
                name TEXT NOT NULL,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(batch_id, subject_name, name)
            )
        `);

        // 3. Drop old notes table (had legacy columns, needs chapter_id as uuid)
        console.log('Dropping old notes table...');
        await client.query('DROP TABLE IF EXISTS notes CASCADE');

        // 4. Recreate notes table with chapter_id reference
        console.log('Creating notes table with chapter_id uuid...');
        await client.query(`
            CREATE TABLE notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                file_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

        // Verify
        const chaptersSchema = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns WHERE table_name = 'chapters' ORDER BY ordinal_position
        `);
        console.log('New chapters schema:');
        console.log(JSON.stringify(chaptersSchema.rows, null, 2));

        const notesSchema = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns WHERE table_name = 'notes' ORDER BY ordinal_position
        `);
        console.log('New notes schema:');
        console.log(JSON.stringify(notesSchema.rows, null, 2));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
