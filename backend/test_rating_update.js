import { pool } from './src/db/index.js';
import { updateStudentRating } from './src/services/studentService.js';

async function test() {
  try {
    // Get a student ID
    const sRes = await pool.query("SELECT user_id FROM students LIMIT 1");
    if (sRes.rowCount === 0) {
      console.log("No students found");
      process.exit(0);
    }
    const studentId = sRes.rows[0].user_id;
    console.log("Testing with studentId:", studentId);

    const ratings = {
      attendance: 5,
      total_classes: 10,
      tests: 4,
      dppPerformance: 5,
      behavior: 5,
      remarks: "Good progress"
    };

    console.log("Calling updateStudentRating...");
    const result = await updateStudentRating(studentId, 'Physics', ratings);
    console.log("Success:", result);
    process.exit(0);
  } catch (err) {
    console.error("Error updating rating:", err);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

test();
