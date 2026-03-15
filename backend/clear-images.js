import { pool } from './src/db/index.js';

async function updateData() {
    console.log('Fetching landing data...');
    try {
        const result = await pool.query('SELECT section_key, content FROM landing_page_data');
        for (const row of result.rows) {
            if (['faculty', 'achievers', 'visions'].includes(row.section_key)) {
                let parsed;
                try {
                    parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
                } catch (e) {
                    continue; // skip invalid json
                }
                const arr = Array.isArray(parsed) ? parsed : [];
                let modified = false;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].image && arr[i].image.startsWith('data:image')) {
                        console.log(`Clearing image for ${row.section_key} -> ${arr[i].name || arr[i].achievement}`);
                        arr[i].image = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop';
                        modified = true;
                    }
                }
                if (modified) {
                    await pool.query('UPDATE landing_page_data SET content = $1 WHERE section_key = $2', [JSON.stringify(arr), row.section_key]);
                    console.log(`Updated ${row.section_key} in DB`);
                }
            }
        }
        console.log('Update complete.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
updateData();
