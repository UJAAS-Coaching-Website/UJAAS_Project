import fs from "fs";
import path from "path";
import assert from "assert";

const ROOT = process.cwd();

function read(relPath) {
  const fullPath = path.join(ROOT, relPath);
  return fs.readFileSync(fullPath, "utf8");
}

function indexOfOrThrow(content, token, filePath) {
  const idx = content.indexOf(token);
  assert.ok(idx >= 0, `Expected token not found in ${filePath}: ${token}`);
  return idx;
}

function assertAfter(content, beforeToken, afterToken, filePath, message) {
  const beforeIdx = indexOfOrThrow(content, beforeToken, filePath);
  const afterIdx = indexOfOrThrow(content, afterToken, filePath);
  assert.ok(afterIdx > beforeIdx, message || `${afterToken} should occur after ${beforeToken} in ${filePath}`);
}

function run() {
  const files = {
    studentService: "backend/src/services/studentService.js",
    facultyService: "backend/src/services/facultyService.js",
    chapterService: "backend/src/services/chapterService.js",
    dppService: "backend/src/services/dppService.js",
    testService: "backend/src/services/testService.js",
    batchService: "backend/src/services/batchService.js",
    noteController: "backend/src/controllers/noteController.js",
    profileController: "backend/src/controllers/profileController.js",
    landingService: "backend/src/services/landingService.js",
    batchController: "backend/src/controllers/batchController.js",
    storageService: "backend/src/services/storageService.js",
  };

  const source = Object.fromEntries(
    Object.entries(files).map(([k, relPath]) => [k, read(relPath)])
  );

  // 1) DB delete first, storage cleanup after for avatar/entity deletion paths.
  assertAfter(
    source.studentService,
    "DELETE FROM users WHERE id = $1 AND role = 'student' RETURNING id",
    "await deleteAvatarFromStorage(avatarUrl);",
    files.studentService,
    "Student delete must perform DB delete before avatar storage cleanup."
  );

  assertAfter(
    source.facultyService,
    "DELETE FROM users WHERE id = $1 AND role = 'faculty' RETURNING id",
    "await deleteAvatarFromStorage(avatarUrl);",
    files.facultyService,
    "Faculty delete must perform DB delete before avatar storage cleanup."
  );

  assertAfter(
    source.dppService,
    "DELETE FROM dpps WHERE id = $1 RETURNING id",
    "await deleteAllImagesForContext(\"dpps\", dppId);",
    files.dppService,
    "DPP delete must perform DB delete before DPP image context cleanup."
  );

  assertAfter(
    source.testService,
    "DELETE FROM tests WHERE id = $1 RETURNING id",
    "await deleteAllImagesForContext(\"tests\", id);",
    files.testService,
    "Test delete must perform DB delete before test image context cleanup."
  );

  assertAfter(
    source.noteController,
    "const deletedNote = await noteService.deleteNote(req.params.id);",
    "await deleteNoteFromStorage(existingNote.file_url);",
    files.noteController,
    "Note delete must perform DB delete before note file storage cleanup."
  );

  // 2) Batch/Chapter cascade cleanup should include notes (pdf/files), question bank files, and context images.
  assert.ok(
    source.batchService.includes("await deleteNoteFromStorage(noteUrl);") &&
      source.batchService.includes("await deleteQuestionBankFileFromStorage(fileUrl);") &&
      source.batchService.includes("await deleteAllImagesForContext(\"tests\", testId);") &&
      source.batchService.includes("await deleteAllImagesForContext(\"dpps\", dppId);"),
    "Batch deletion must include note files, question-bank files, and test/DPP image context cleanup."
  );

  assertAfter(
    source.chapterService,
    "await client.query(\"COMMIT\");",
    "await deleteNoteFromStorage(noteUrl);",
    files.chapterService,
    "Chapter delete should cleanup note storage after commit."
  );

  assertAfter(
    source.chapterService,
    "await client.query(\"COMMIT\");",
    "await deleteAllImagesForContext(\"dpps\", dppId);",
    files.chapterService,
    "Chapter delete should cleanup DPP images after commit."
  );

  // 3) Replacement behavior: old avatar, landing image, and timetable should be deleted.
  assertAfter(
    source.profileController,
    "await updateUserAvatar(req.user.sub, avatarUrl);",
    "await deleteAvatarFromStorage(previousAvatarUrl);",
    files.profileController,
    "Avatar replacement must delete previous avatar after DB update."
  );

  assert.ok(
    source.landingService.includes("removedImageUrls") &&
      source.landingService.includes("await deleteLandingPageImageFromStorage(imageUrl);"),
    "Landing data update must cleanup removed/replaced landing images."
  );

  assertAfter(
    source.batchController,
    "await deleteTimetableFromStorage(batch.timetable_url);",
    "const timetableUrl = await uploadTimetableToStorage(",
    files.batchController,
    "Timetable replacement must delete previous timetable before uploading new one."
  );

  // 4) Reliability safety net: cleanup failures are queued for retry.
  assert.ok(
    source.storageService.includes("await enqueueStorageCleanupTask({") &&
      source.storageService.includes("type: 'delete_url'") &&
      source.storageService.includes("type: 'delete_context'"),
    "Storage service should enqueue failed cleanup tasks for retry."
  );

  console.log("PASS: Storage cleanup verification checks passed.");
}

run();
