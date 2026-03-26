import dotenv from "dotenv";

dotenv.config({ path: "d:/UJAAS_Project/backend/.env" });

const API_BASE_URL = process.env.CACHE_TEST_API_BASE_URL || "http://localhost:4000";
const ADMIN_LOGIN_ID = process.env.CACHE_TEST_ADMIN_LOGIN_ID;
const ADMIN_PASSWORD = process.env.CACHE_TEST_ADMIN_PASSWORD;

if (!ADMIN_LOGIN_ID || !ADMIN_PASSWORD) {
  console.error("Missing CACHE_TEST_ADMIN_LOGIN_ID or CACHE_TEST_ADMIN_PASSWORD");
  process.exit(1);
}

if (typeof fetch !== "function") {
  console.error("Global fetch is not available. Use Node.js 18+.");
  process.exit(1);
}

const tag = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP4DwABAQEAG7buVwAAAABJRU5ErkJggg==",
  "base64"
);

const state = {
  adminToken: null,
  adminUserId: null,
  facultyToken: null,
  facultyId: null,
  facultyEmail: `storage.faculty.${tag}@example.com`,
  facultyPassword: "Storage@123",
  subjectName: `storage-subject-${tag}`,
  batchId: null,
  chapterId: null,
  noteId: null,
  qbFileId: null,
  testId: null,
  dppId: null,
  uploadedImageUrls: [],
  publicFetchFailures: [],
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message) {
  console.log(`\n[STEP] ${message}`);
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function apiJson(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonSafe(response);
  return { ok: response.ok, status: response.status, data };
}

async function apiMultipart(path, { token, fields = {}, fileFieldName, fileName, mimeType, fileBuffer }) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  });

  if (fileFieldName && fileBuffer) {
    form.append(fileFieldName, new Blob([fileBuffer], { type: mimeType }), fileName);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await parseJsonSafe(response);
  return { ok: response.ok, status: response.status, data };
}

async function ensurePublicFetchOk(url, label) {
  let lastStatus = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, { method: "GET" });
    lastStatus = response.status;
    if (response.ok) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  state.publicFetchFailures.push(`${label} not publicly fetchable (${lastStatus}) -> ${url}`);
  return false;
}

function assertPathContains(url, expectedSegment, label) {
  assert(typeof url === "string" && url.length > 10, `${label} URL is missing`);
  assert(url.includes(expectedSegment), `${label} URL does not include expected segment '${expectedSegment}': ${url}`);
}

async function loginAsAdmin() {
  const res = await apiJson("/api/auth/login", {
    method: "POST",
    body: { loginId: ADMIN_LOGIN_ID, password: ADMIN_PASSWORD },
  });

  assert(res.ok, `Admin login failed (${res.status}): ${res.data?.message || "unknown error"}`);
  assert(res.data?.token, "Admin token missing");
  assert(res.data?.user?.id, "Admin user id missing in login response");
  state.adminToken = res.data.token;
  state.adminUserId = res.data.user.id;
}

async function uploadAndVerifyAvatar() {
  logStep("Verify DP/avatar upload path and fetch");
  const uploadRes = await apiMultipart("/api/profile/avatar", {
    token: state.adminToken,
    fields: {},
    fileFieldName: "avatar",
    fileName: "profile.png",
    mimeType: "image/png",
    fileBuffer: tinyPngBuffer,
  });

  assert(uploadRes.ok, `Avatar upload failed (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);
  const avatarUrl = uploadRes.data?.avatarUrl;
  assertPathContains(avatarUrl, `/avatars/${state.adminUserId}/`, "Avatar");
  assert(/avatar-\d+\.webp$/i.test(avatarUrl), `Avatar URL does not end with expected webp filename: ${avatarUrl}`);

  const meRes = await apiJson("/api/auth/me", { token: state.adminToken });
  assert(meRes.ok, `GET /api/auth/me failed (${meRes.status})`);
  const meAvatar = meRes.data?.user?.avatarUrl || meRes.data?.user?.avatar_url || null;
  assert(meAvatar === avatarUrl, `Avatar URL mismatch in profile fetch. expected='${avatarUrl}', actual='${meAvatar}'`);

  await ensurePublicFetchOk(avatarUrl, "Avatar URL");
  console.log(`[PASS] Avatar path/fetch OK: ${avatarUrl}`);
}

async function createFacultyAndBatch() {
  logStep("Create faculty + batch + chapter context for notes/DPP/question-bank tests");
  const facultyRes = await apiJson("/api/faculties", {
    method: "POST",
    token: state.adminToken,
    body: {
      name: `Storage Faculty ${tag}`,
      email: state.facultyEmail,
      subject: state.subjectName,
      phone: "7777777777",
      designation: "Teacher",
      joinDate: "2025-01-01",
      password: state.facultyPassword,
    },
  });

  assert(facultyRes.ok, `Create faculty failed (${facultyRes.status}): ${facultyRes.data?.message || "unknown error"}`);
  state.facultyId = facultyRes.data?.id;
  assert(state.facultyId, "Faculty id missing in response");

  const batchRes = await apiJson("/api/batches", {
    method: "POST",
    token: state.adminToken,
    body: {
      name: `storage-batch-${tag}`,
      subjects: [state.subjectName],
      facultyIds: [state.facultyId],
    },
  });

  assert(batchRes.ok, `Create batch failed (${batchRes.status}): ${batchRes.data?.message || "unknown error"}`);
  state.batchId = batchRes.data?.id;
  assert(state.batchId, "Batch id missing in response");

  const facultyLoginRes = await apiJson("/api/auth/login", {
    method: "POST",
    body: { loginId: state.facultyEmail, password: state.facultyPassword },
  });

  assert(facultyLoginRes.ok, `Faculty login failed (${facultyLoginRes.status}): ${facultyLoginRes.data?.message || "unknown error"}`);
  state.facultyToken = facultyLoginRes.data?.token;
  assert(state.facultyToken, "Faculty token missing in login response");

  const chapterRes = await apiJson("/api/chapters", {
    method: "POST",
    token: state.facultyToken,
    body: {
      batch_id: state.batchId,
      subject_name: state.subjectName,
      name: `storage-chapter-${tag}`,
    },
  });

  assert(chapterRes.ok, `Create chapter failed (${chapterRes.status}): ${chapterRes.data?.message || "unknown error"}`);
  state.chapterId = chapterRes.data?.id;
  assert(state.chapterId, "Chapter id missing in response");
}

async function verifyNotesUploadAndFetch() {
  logStep("Verify notes upload path and fetch");
  const uploadRes = await apiMultipart("/api/notes/upload", {
    token: state.facultyToken,
    fields: {
      chapter_id: state.chapterId,
      title: `storage-note-${tag}`,
    },
    fileFieldName: "file",
    fileName: "note-image.png",
    mimeType: "image/png",
    fileBuffer: tinyPngBuffer,
  });

  assert(uploadRes.ok, `Notes upload failed (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);
  state.noteId = uploadRes.data?.id;
  const fileUrl = uploadRes.data?.file_url;
  assert(state.noteId, "Notes upload response missing note id");
  assertPathContains(fileUrl, `/notes/batches/${state.batchId}/chapters/${state.chapterId}/notes/${state.noteId}/`, "Notes file");

  const listRes = await apiJson(`/api/notes?chapter_id=${encodeURIComponent(state.chapterId)}`, {
    token: state.facultyToken,
  });
  assert(listRes.ok, `GET /api/notes failed (${listRes.status})`);
  const row = Array.isArray(listRes.data) ? listRes.data.find((entry) => entry?.id === state.noteId) : null;
  assert(row, "Uploaded note not found in notes fetch");
  assert(row.file_url === fileUrl, `Notes file_url mismatch on fetch. expected='${fileUrl}', actual='${row?.file_url}'`);

  await ensurePublicFetchOk(fileUrl, "Notes file URL");
  console.log(`[PASS] Notes path/fetch OK: ${fileUrl}`);
}

async function verifyQuestionBankUploadAndFetch() {
  logStep("Verify question-bank upload path and fetch");
  const title = `storage-qb-title-${tag}`;
  const uploadRes = await apiMultipart("/api/question-bank/upload", {
    token: state.facultyToken,
    fields: {
      title,
      difficulty: "easy",
      batch_ids: state.batchId,
    },
    fileFieldName: "file",
    fileName: "qb-file.png",
    mimeType: "image/png",
    fileBuffer: tinyPngBuffer,
  });

  assert(uploadRes.ok, `Question-bank upload failed (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);
  state.qbFileId = uploadRes.data?.id;
  const fileUrl = uploadRes.data?.file_url;
  assert(state.qbFileId, "Question-bank response missing file id");

  const subjectSlug = state.subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  assertPathContains(fileUrl, `/question-bank/subjects/${subjectSlug}/files/${state.qbFileId}/`, "Question-bank file");

  const listRes = await apiJson("/api/question-bank", { token: state.facultyToken });
  assert(listRes.ok, `GET /api/question-bank failed (${listRes.status})`);
  const items = Array.isArray(listRes.data?.items) ? listRes.data.items : [];
  const row = items.find((entry) => entry?.id === state.qbFileId);
  assert(row, "Uploaded question-bank file not found in fetch response");
  assert(row.file_url === fileUrl, `Question-bank file_url mismatch on fetch. expected='${fileUrl}', actual='${row?.file_url}'`);

  await ensurePublicFetchOk(fileUrl, "Question-bank file URL");
  console.log(`[PASS] Question-bank path/fetch OK: ${fileUrl}`);
}

async function uploadAssessmentImage({ token, context, contextId, itemRole }) {
  const uploadRes = await apiMultipart("/api/upload", {
    token,
    fields: {
      context,
      contextId,
      itemRole,
    },
    fileFieldName: "image",
    fileName: `${context}-${itemRole}.png`,
    mimeType: "image/png",
    fileBuffer: tinyPngBuffer,
  });

  assert(uploadRes.ok, `Upload image failed for ${context}/${itemRole} (${uploadRes.status}): ${uploadRes.data?.message || "unknown error"}`);
  const imageUrl = uploadRes.data?.imageUrl;
  assertPathContains(imageUrl, `/questions/${context}/${contextId}/${itemRole}-`, `${context} ${itemRole} image`);
  state.uploadedImageUrls.push(imageUrl);
  await ensurePublicFetchOk(imageUrl, `${context} ${itemRole} image URL`);
  return imageUrl;
}

async function verifyTestQuestionOptionImages() {
  logStep("Verify test question/option image upload path and fetch");
  const title = `storage-test-${tag}`;

  const createRes = await apiJson("/api/tests", {
    method: "POST",
    token: state.adminToken,
    body: {
      title,
      format: "Custom",
      durationMinutes: 30,
      totalMarks: 4,
      scheduleDate: "",
      scheduleTime: null,
      instructions: "storage verification",
      status: "live",
      batchIds: [state.batchId],
      questions: [],
    },
  });

  assert(createRes.ok, `Create test failed (${createRes.status}): ${createRes.data?.message || "unknown error"}`);
  state.testId = createRes.data?.id;
  assert(state.testId, "Test id missing in create response");

  const questionImg = await uploadAssessmentImage({
    token: state.adminToken,
    context: "tests",
    contextId: state.testId,
    itemRole: "question",
  });
  const optionImg = await uploadAssessmentImage({
    token: state.adminToken,
    context: "tests",
    contextId: state.testId,
    itemRole: "option",
  });

  const updateRes = await apiJson(`/api/tests/${state.testId}`, {
    method: "PUT",
    token: state.adminToken,
    body: {
      title,
      format: "Custom",
      durationMinutes: 30,
      totalMarks: 4,
      scheduleDate: "",
      scheduleTime: null,
      instructions: "storage verification",
      batchIds: [state.batchId],
      questions: [
        {
          subject: state.subjectName,
          type: "MCQ",
          question_text: "Storage image mapping test question",
          question_img: questionImg,
          options: ["A", "B", "C", "D"],
          optionImages: [optionImg, null, null, null],
          correctAnswer: 1,
          marks: 4,
          negativeMarks: 0,
        },
      ],
    },
  });

  assert(updateRes.ok, `Update test failed (${updateRes.status}): ${updateRes.data?.message || "unknown error"}`);

  const getRes = await apiJson(`/api/tests/${state.testId}`, { token: state.adminToken });
  assert(getRes.ok, `GET /api/tests/${state.testId} failed (${getRes.status})`);

  const question = Array.isArray(getRes.data?.questions) ? getRes.data.questions[0] : null;
  assert(question, "No test question returned in fetch response");
  assert(question.question_img === questionImg, `Test question_img mismatch on fetch. expected='${questionImg}', actual='${question?.question_img}'`);
  const fetchedOptionImgs = Array.isArray(question.option_imgs) ? question.option_imgs : [];
  assert(fetchedOptionImgs[0] === optionImg, `Test option image mismatch on fetch. expected='${optionImg}', actual='${fetchedOptionImgs[0]}'`);

  console.log(`[PASS] Test image path/fetch OK: question=${questionImg} option=${optionImg}`);
}

async function verifyDppQuestionOptionImages() {
  logStep("Verify DPP question/option image upload path and fetch");
  const title = `storage-dpp-${tag}`;
  const createRes = await apiJson("/api/dpps", {
    method: "POST",
    token: state.facultyToken,
    body: {
      title,
      instructions: "storage verification",
      chapter_id: state.chapterId,
      questions: [],
    },
  });

  assert(createRes.ok, `Create DPP failed (${createRes.status}): ${createRes.data?.message || "unknown error"}`);
  state.dppId = createRes.data?.id;
  assert(state.dppId, "DPP id missing in create response");

  const questionImg = await uploadAssessmentImage({
    token: state.facultyToken,
    context: "dpps",
    contextId: state.dppId,
    itemRole: "question",
  });
  const optionImg = await uploadAssessmentImage({
    token: state.facultyToken,
    context: "dpps",
    contextId: state.dppId,
    itemRole: "option",
  });

  const updateRes = await apiJson(`/api/dpps/${state.dppId}`, {
    method: "PUT",
    token: state.facultyToken,
    body: {
      title,
      instructions: "storage verification",
      chapter_id: state.chapterId,
      questions: [
        {
          subject: state.subjectName,
          type: "MCQ",
          question: "DPP storage image mapping test question",
          question_img: questionImg,
          options: ["A", "B", "C", "D"],
          optionImages: [optionImg, null, null, null],
          correctAnswer: 1,
          difficulty: "easy",
        },
      ],
    },
  });

  assert(updateRes.ok, `Update DPP failed (${updateRes.status}): ${updateRes.data?.message || "unknown error"}`);

  const getRes = await apiJson(`/api/dpps/${state.dppId}`, { token: state.facultyToken });
  assert(getRes.ok, `GET /api/dpps/${state.dppId} failed (${getRes.status})`);
  const question = Array.isArray(getRes.data?.questions) ? getRes.data.questions[0] : null;
  assert(question, "No DPP question returned in fetch response");
  assert(question.question_img === questionImg, `DPP question_img mismatch on fetch. expected='${questionImg}', actual='${question?.question_img}'`);
  const fetchedOptionImgs = Array.isArray(question.option_imgs) ? question.option_imgs : [];
  assert(fetchedOptionImgs[0] === optionImg, `DPP option image mismatch on fetch. expected='${optionImg}', actual='${fetchedOptionImgs[0]}'`);

  console.log(`[PASS] DPP image path/fetch OK: question=${questionImg} option=${optionImg}`);
}

async function deleteImageByUrl(token, imageUrl) {
  if (!imageUrl) return;
  await apiJson("/api/upload", {
    method: "DELETE",
    token,
    body: { imageUrl },
  });
}

async function cleanup() {
  logStep("Cleanup temporary data");

  if (state.adminToken) {
    await apiJson("/api/profile/avatar", { method: "DELETE", token: state.adminToken });
  }

  if (state.facultyToken && state.noteId) {
    await apiJson(`/api/notes/${state.noteId}`, { method: "DELETE", token: state.facultyToken });
  }

  if (state.facultyToken && state.qbFileId && state.batchId) {
    await apiJson(`/api/question-bank/${state.qbFileId}/batches/${state.batchId}`, {
      method: "DELETE",
      token: state.facultyToken,
    });
  }

  if (state.adminToken && state.testId) {
    await apiJson(`/api/tests/${state.testId}`, { method: "DELETE", token: state.adminToken });
  }

  if (state.facultyToken && state.dppId) {
    await apiJson(`/api/dpps/${state.dppId}`, { method: "DELETE", token: state.facultyToken });
  }

  for (const imageUrl of state.uploadedImageUrls) {
    await deleteImageByUrl(state.adminToken || state.facultyToken, imageUrl);
  }

  if (state.facultyToken && state.chapterId) {
    await apiJson(`/api/chapters/${state.chapterId}`, { method: "DELETE", token: state.facultyToken });
  }

  if (state.adminToken && state.batchId) {
    await apiJson(`/api/batches/${state.batchId}`, { method: "DELETE", token: state.adminToken });
    await apiJson(`/api/batches/${state.batchId}/permanent`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken && state.facultyId) {
    await apiJson(`/api/faculties/${state.facultyId}`, { method: "DELETE", token: state.adminToken });
  }

  if (state.adminToken) {
    const subjectsRes = await apiJson("/api/subjects", { token: state.adminToken });
    if (subjectsRes.ok && Array.isArray(subjectsRes.data)) {
      const subject = subjectsRes.data.find((entry) => entry?.name === state.subjectName);
      if (subject?.id) {
        await apiJson(`/api/subjects/${subject.id}`, { method: "DELETE", token: state.adminToken });
      }
    }
  }
}

async function run() {
  console.log("[INFO] Running storage bucket structure and fetch verification");
  await loginAsAdmin();
  await uploadAndVerifyAvatar();
  await createFacultyAndBatch();
  await verifyNotesUploadAndFetch();
  await verifyQuestionBankUploadAndFetch();
  await verifyTestQuestionOptionImages();
  await verifyDppQuestionOptionImages();

  if (state.publicFetchFailures.length > 0) {
    throw new Error(`Public fetch validation failed for ${state.publicFetchFailures.length} URL(s):\n- ${state.publicFetchFailures.join("\n- ")}`);
  }

  console.log("\n✅ Storage bucket structure verification passed for avatar, notes, question-bank, tests, and dpps.");
}

run()
  .then(async () => {
    await cleanup();
  })
  .catch(async (error) => {
    console.error(`\n❌ Storage bucket verification failed: ${error.message}`);
    try {
      await cleanup();
    } catch {
      // ignore cleanup errors
    }
    process.exit(1);
  });
