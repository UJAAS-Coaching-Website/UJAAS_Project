import { pool } from "../db/index.js";

const DEFAULT_CONTACT = {
    phone: "+91 98765 43210", 
    email: "info@ujaas.com", 
    address: "123 Education St, Delhi"
};

export async function getLandingData() {
    const data = {
        courses: [],
        faculty: [],
        achievers: [],
        visions: [],
        contact: DEFAULT_CONTACT,
    };

    const coursesRes = await pool.query("SELECT id, name FROM landing_courses ORDER BY created_at ASC");
    data.courses = coursesRes.rows.map(r => ({ id: r.id, name: r.name }));

    const facultyRes = await pool.query("SELECT name, subject, designation, experience, image_url AS image FROM landing_faculty ORDER BY created_at ASC");
    data.faculty = facultyRes.rows;

    const achieversRes = await pool.query("SELECT name, achievement, year, image_url AS image FROM landing_achievers ORDER BY created_at ASC");
    data.achievers = achieversRes.rows.map(r => ({
        ...r,
        year: r.year ? r.year.toString() : ""
    }));

    const visionsRes = await pool.query("SELECT id, name, designation, vision, image_url AS image FROM landing_visions ORDER BY created_at ASC");
    data.visions = visionsRes.rows;

    return data;
}

export async function updateFullLandingData(data) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (data.courses && Array.isArray(data.courses)) {
            // Accept both {id, name} objects and plain strings
            const names = data.courses.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
            if (names.length > 0) {
                await client.query("DELETE FROM landing_courses WHERE name != ALL($1)", [names]);
            } else {
                await client.query("DELETE FROM landing_courses");
            }
            for (const course of names) {
                await client.query(
                    "INSERT INTO landing_courses (name) VALUES ($1) ON CONFLICT DO NOTHING",
                    [course]
                );
            }
        }

        if (data.faculty && Array.isArray(data.faculty)) {
            const names = data.faculty.map(f => f.name).filter(Boolean);
            if (names.length > 0) {
                await client.query("DELETE FROM landing_faculty WHERE name != ALL($1)", [names]);
            } else {
                await client.query("DELETE FROM landing_faculty");
            }
            for (const fac of data.faculty) {
                if (!fac.name) continue;
                await client.query(
                    `INSERT INTO landing_faculty (name, subject, designation, experience, image_url) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (name) DO UPDATE SET 
                        subject = EXCLUDED.subject, 
                        designation = EXCLUDED.designation, 
                        experience = EXCLUDED.experience, 
                        image_url = EXCLUDED.image_url`,
                    [fac.name, fac.subject || "", fac.designation || "", fac.experience || "", fac.image || null]
                );
            }
        }

        if (data.achievers && Array.isArray(data.achievers)) {
            const names = data.achievers.map(a => a.name).filter(Boolean);
            if (names.length > 0) {
                await client.query("DELETE FROM landing_achievers WHERE name != ALL($1)", [names]);
            } else {
                await client.query("DELETE FROM landing_achievers");
            }
            for (const ach of data.achievers) {
                if (!ach.name) continue;
                await client.query(
                    `INSERT INTO landing_achievers (name, achievement, year, image_url) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (name) DO UPDATE SET 
                        achievement = EXCLUDED.achievement, 
                        year = EXCLUDED.year, 
                        image_url = EXCLUDED.image_url`,
                    [ach.name, ach.achievement || "", ach.year != null ? String(ach.year) : "", ach.image || null]
                );
            }
        }

        if (data.visions && Array.isArray(data.visions)) {
            const validVisions = data.visions.filter(v => v.id && v.name);
            const ids = validVisions.map(v => v.id);
            if (ids.length > 0) {
                await client.query("DELETE FROM landing_visions WHERE id != ALL($1)", [ids]);
            } else {
                await client.query("DELETE FROM landing_visions");
            }
            for (const vis of validVisions) {
                await client.query(
                    `INSERT INTO landing_visions (id, name, designation, vision, image_url) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (id) DO UPDATE SET 
                        name = EXCLUDED.name, 
                        designation = EXCLUDED.designation, 
                        vision = EXCLUDED.vision, 
                        image_url = EXCLUDED.image_url`,
                    [vis.id, vis.name, vis.designation || "", vis.vision || "", vis.image || null]
                );
            }
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
    return getLandingData();
}
