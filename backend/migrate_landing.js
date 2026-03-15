import { pool } from './src/db/index.js';

async function migrate() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log('Creating new tables...');
        await client.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

            CREATE TABLE IF NOT EXISTS landing_courses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL UNIQUE,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS landing_faculty (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                designation VARCHAR(255),
                experience VARCHAR(255),
                image_url TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS landing_achievers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                achievement VARCHAR(255) NOT NULL,
                year VARCHAR(50),
                image_url TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS landing_visions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                designation VARCHAR(255),
                vision TEXT NOT NULL,
                image_url TEXT,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        console.log('Fetching old data...');
        const res = await client.query('SELECT * FROM landing_page_data');
        const data = res.rows;
        
        let displayOrder = 0;

        for (const row of data) {
            let contentArr = [];
            try {
                contentArr = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
                if (!Array.isArray(contentArr)) continue;
            } catch (e) {
                continue;
            }

            displayOrder = 0;
            if (row.section_key === 'courses') {
                for (const course of contentArr) {
                    await client.query(
                        'INSERT INTO landing_courses (name, display_order) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [course, displayOrder++]
                    );
                }
            } else if (row.section_key === 'faculty') {
                for (const fac of contentArr) {
                    await client.query(
                        'INSERT INTO landing_faculty (name, subject, designation, experience, image_url, display_order) VALUES ($1, $2, $3, $4, $5, $6)',
                        [fac.name || 'Unknown', fac.subject || 'Unknown', fac.designation || '', fac.experience || '', fac.image || null, displayOrder++]
                    );
                }
            } else if (row.section_key === 'achievers') {
                for (const ach of contentArr) {
                    await client.query(
                        'INSERT INTO landing_achievers (name, achievement, year, image_url, display_order) VALUES ($1, $2, $3, $4, $5)',
                        [ach.name || 'Unknown', ach.achievement || 'Unknown', ach.year != null ? String(ach.year) : '', ach.image || null, displayOrder++]
                    );
                }
            } else if (row.section_key === 'visions') {
                for (const vis of contentArr) {
                    await client.query(
                        'INSERT INTO landing_visions (id, name, designation, vision, image_url, display_order) VALUES (COALESCE((NULLIF($1, \'\')::uuid), uuid_generate_v4()), $2, $3, $4, $5, $6)',
                        [vis.id?.length === 36 ? vis.id : null, vis.name || 'Unknown', vis.designation || '', vis.vision || '', vis.image || null, displayOrder++]
                    );
                }
            }
        }

        console.log('Dropping old table...');
        await client.query('DROP TABLE IF EXISTS landing_page_data');

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
