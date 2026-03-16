import { pool } from './src/db/index.js';
import { updateStudentRating } from './src/services/studentService.js';

async function test() {
  try {
    const studentId = '7a7f3880-3521-472d-bb6e-e2b78df9ef54';
    const ratings = {
      attendance: 5,
      total_classes: 10,
      tests: 4,
      dppPerformance: 5,
      behavior: 5,
      remarks: "Test update for specific student"
    };

    console.log("Calling updateStudentRating for student 7a7f3880...");
    const result = await updateStudentRating(studentId, 'Chemistry', ratings);
    console.log("Success:", result);
    process.exit(0);
  } catch (err) {
    console.error("Error updating rating:", err);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

test();
