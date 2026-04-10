const { pool } = require('./backend/src/db/index.js');

async function checkAvatar() {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.avatar_url
      FROM users u
      INNER JOIN faculties f ON u.id = f.user_id
      WHERE u.name = 'Ankit Kumar'
    `);
    
    console.log('Database query result:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log(`\n✅ Found faculty: ${row.name}`);
      console.log(`avatar_url in DB: ${row.avatar_url || '(NULL)'}`);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

checkAvatar();
