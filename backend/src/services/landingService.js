import { pool } from "../db/index.js";

const SECTION_KEYS = ["courses", "faculty", "achievers", "visions", "contact"];

const DEFAULT_DATA = {
    courses: [
        "JEE MAINS / ADVANCED",
        "NEET",
        "BOARDS",
        "GUJCET",
        "11TH SCIENCE",
        "12TH SCIENCE",
        "7TH TO 10TH FOUNDATION",
        "DROPPER BATCH",
    ],
    faculty: [],
    achievers: [],
    visions: [],
    contact: { phone: "+91 98765 43210", email: "info@ujaas.com", address: "123 Education St, Delhi" },
};

export async function getLandingData() {
    const result = await pool.query(
        "SELECT section_key, content FROM landing_page_data WHERE section_key = ANY($1)",
        [SECTION_KEYS]
    );

    const data = { ...DEFAULT_DATA };
    for (const row of result.rows) {
        if (SECTION_KEYS.includes(row.section_key)) {
            data[row.section_key] = row.content;
        }
    }
    return data;
}

export async function updateFullLandingData(data) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const key of SECTION_KEYS) {
            if (data[key] !== undefined) {
                // Delete existing row for this section_key, then insert new one
                await client.query(
                    "DELETE FROM landing_page_data WHERE section_key = $1",
                    [key]
                );
                await client.query(
                    `INSERT INTO landing_page_data (id, section_key, content, updated_at)
                     VALUES (gen_random_uuid(), $1, $2, now())`,
                    [key, JSON.stringify(data[key])]
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
