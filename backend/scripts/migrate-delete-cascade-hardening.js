import "./load-env.js";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function ensureConstraintWithDeleteRule(client, {
  tableName,
  constraintName,
  constraintSql,
  expectedDeleteType,
}) {
  const existing = await client.query(
    `SELECT conname, confdeltype
     FROM pg_constraint
     WHERE conname = $1`,
    [constraintName]
  );

  if (existing.rowCount > 0) {
    const currentDeleteType = existing.rows[0].confdeltype;
    if (currentDeleteType === expectedDeleteType) {
      console.log(`[migrate] ${constraintName} already configured.`);
      return;
    }

    await client.query(
      `ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`
    );
    console.log(`[migrate] Dropped ${constraintName} to re-apply delete rule.`);
  }

  await client.query(constraintSql);
  console.log(`[migrate] Applied ${constraintName}.`);
}

async function run() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await ensureConstraintWithDeleteRule(client, {
      tableName: "chapters",
      constraintName: "chapters_batch_subject_id_fkey",
      constraintSql: `ALTER TABLE chapters
        ADD CONSTRAINT chapters_batch_subject_id_fkey
        FOREIGN KEY (batch_subject_id)
        REFERENCES batch_subjects(id)
        ON DELETE CASCADE`,
      expectedDeleteType: "c",
    });

    await ensureConstraintWithDeleteRule(client, {
      tableName: "student_ratings",
      constraintName: "student_ratings_batch_subject_id_fkey",
      constraintSql: `ALTER TABLE student_ratings
        ADD CONSTRAINT student_ratings_batch_subject_id_fkey
        FOREIGN KEY (batch_subject_id)
        REFERENCES batch_subjects(id)
        ON DELETE CASCADE`,
      expectedDeleteType: "c",
    });

    await ensureConstraintWithDeleteRule(client, {
      tableName: "tests",
      constraintName: "tests_created_by_fkey",
      constraintSql: `ALTER TABLE tests
        ADD CONSTRAINT tests_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL`,
      expectedDeleteType: "n",
    });

    await client.query("COMMIT");
    console.log("[migrate] delete-cascade hardening migration completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[migrate] delete-cascade hardening migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
