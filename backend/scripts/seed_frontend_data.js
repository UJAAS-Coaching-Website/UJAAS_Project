import pkg from 'pg';
const { Pool } = pkg;
import { hashPassword } from '../src/utils/password.js';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const generateInitialPassword = (name) => {
    const firstName = name.split(' ')[0].toLowerCase();
    return `${firstName}@123`;
};

const seededStudents = [
    {
        id: '1', name: 'Rahul Sharma', rollNumber: '2024001',
        batch: '12th JEE', phoneNumber: '+91 99999 11111', dateOfBirth: '2007-04-12',
        address: 'Sector 15, Vasundhara, Ghaziabad', parentContact: '+91 99999 22222'
    },
    {
        id: '2', name: 'Priya Patel', rollNumber: '2024002',
        batch: '12th NEET', phoneNumber: '+91 88888 11111', dateOfBirth: '2007-06-18',
        address: 'MG Road, Pune, Maharashtra', parentContact: '+91 88888 22222'
    },
    {
        id: '3', name: 'Amit Kumar', rollNumber: '2024003',
        batch: 'Dropper JEE', phoneNumber: '+91 77777 11111', dateOfBirth: '2006-09-22',
        address: 'Indira Nagar, Bengaluru, Karnataka', parentContact: '+91 77777 22222'
    },
    {
        id: '4', name: 'Sneha Mehta', rollNumber: '2024004',
        batch: '11th JEE', phoneNumber: '+91 98989 11111', dateOfBirth: '2008-01-05',
        address: 'Satellite Road, Ahmedabad, Gujarat', parentContact: '+91 98989 22222'
    },
    {
        id: '5', name: 'Karan Desai', rollNumber: '2024005',
        batch: '11th NEET', phoneNumber: '+91 97979 11111', dateOfBirth: '2008-03-15',
        address: 'Banjara Hills, Hyderabad, Telangana', parentContact: '+91 97979 22222'
    },
    {
        id: '6', name: 'Ananya Kapoor', rollNumber: '2024006',
        batch: '12th JEE', phoneNumber: '+91 96969 11111', dateOfBirth: '2007-11-30',
        address: 'Civil Lines, Delhi', parentContact: '+91 96969 22222'
    }
];

const seededFaculty = [
    { id: 't1', name: 'Dr. V.K. Sharma', email: 'vk.sharma@example.com', subject: 'Physics', rating: 4.8 },
    { id: 't2', name: 'Prof. S. Gupta', email: 's.gupta@example.com', subject: 'Chemistry', rating: 4.5 },
    { id: 't3', name: 'Dr. R.K. Yadav', email: 'rk.yadav@example.com', subject: 'Mathematics', rating: 4.9 },
    { id: 't4', name: 'Ms. Tanya Bose', email: 'tanya.bose@example.com', subject: 'Biology', rating: 4.2 },
    { id: 't5', name: 'Mr. Arjun Malhotra', email: 'arjun.m@example.com', subject: 'Mathematics', rating: 4.6 },
    { id: 't6', name: 'Dr. Leena Rao', email: 'leena.rao@example.com', subject: 'Chemistry', rating: 4.7 },
];

async function seed() {
    try {
        console.log('Seeding faculty...');
        for (const fac of seededFaculty) {
            const password = hashPassword(generateInitialPassword(fac.name));

            // Check if existing
            const userCheck = await pool.query('SELECT id FROM users WHERE login_id = $1', [fac.email]);
            if (userCheck.rowCount > 0) {
                console.log(`Faculty ${fac.email} already exists, skipping.`);
                continue;
            }

            const userRes = await pool.query(
                `INSERT INTO users (name, login_id, role, password_hash, created_at)
                 VALUES ($1, $2, 'faculty', $3, NOW())
                 RETURNING id`,
                [fac.name, fac.email, password]
            );

            const userId = userRes.rows[0].id;

            await pool.query(
                `INSERT INTO faculties (user_id, subject)
                 VALUES ($1, $2)`,
                [userId, fac.subject]
            );
        }
        console.log('Faculty seeded.');

        console.log('Seeding students...');
        for (const stu of seededStudents) {
            const password = hashPassword(generateInitialPassword(stu.name));

            // Student login_id is their roll_number
            const userCheck = await pool.query('SELECT id FROM users WHERE login_id = $1', [stu.rollNumber]);
            let userId = null;

            if (userCheck.rowCount > 0) {
                console.log(`Student ${stu.rollNumber} already exists, checking batch assignment.`);
                userId = userCheck.rows[0].id;

                // Add student if they don't exist yet (from previous failed run)
                await pool.query(
                    `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact)
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING`,
                    [userId, stu.rollNumber, stu.phoneNumber, stu.address, stu.dateOfBirth, stu.parentContact]
                );
            } else {
                const userRes = await pool.query(
                    `INSERT INTO users (name, login_id, role, password_hash, created_at)
                     VALUES ($1, $2, 'student', $3, NOW())
                     RETURNING id`,
                    [stu.name, stu.rollNumber, password]
                );
                userId = userRes.rows[0].id;

                await pool.query(
                    `INSERT INTO students (user_id, roll_number, phone, address, dob, parent_contact)
                     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING`,
                    [userId, stu.rollNumber, stu.phoneNumber, stu.address, stu.dateOfBirth, stu.parentContact]
                );
            }

            // Assign to batch
            if (stu.batch) {
                const batchRes = await pool.query('SELECT id FROM batches WHERE name = $1 AND is_active = true LIMIT 1', [stu.batch]);
                if (batchRes.rowCount > 0) {
                    const batchId = batchRes.rows[0].id;
                    await pool.query(
                        `UPDATE students
                         SET assigned_batch_id = $2
                         WHERE user_id = $1`,
                        [userId, batchId]
                    );
                } else {
                    console.log(`Warning: Batch ${stu.batch} not found for student ${stu.name}`);
                }
            }
        }
        console.log('Students seeded.');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await pool.end();
    }
}

seed();
