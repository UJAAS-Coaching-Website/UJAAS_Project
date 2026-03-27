import {
    getAllTests,
    getTestsForStudent,
    getTestById,
    getTestByIdForStudent,
    getStudentAttemptSummary,
    startOrResumeStudentAttempt,
    saveStudentAttemptProgress,
    submitStudentAttempt,
    getAttemptResultForUser,
    getAttemptQuestionExplanationForUser,
    getStudentAttemptResults,
    getTestAttemptAnalysis,
    createTest,
    updateTestStatus,
    updateTest,
    deleteTest
} from "../services/testService.js";
import { createMultiBatchNotification } from "../services/notificationService.js";
import { getDeviceIdFromRequest } from "../utils/device.js";

function isPositiveNumber(value) {
    return Number.isFinite(Number(value)) && Number(value) > 0;
}

export async function listTests(req, res) {
    try {
        let tests = req.user?.role === 'student'
            ? await getTestsForStudent(req.user.sub)
            : await getAllTests();

        // Only admins can see drafts.
        if (req.user?.role !== 'admin') {
            tests = tests.filter(t => t.status !== 'draft');
        }
        return res.status(200).json(tests);
    } catch (error) {
        console.error("listTests error:", error.message);
        return res.status(500).json({ message: "failed to fetch tests", error: error.message });
    }
}

export async function getTest(req, res) {
    try {
        const test = req.user?.role === 'student'
            ? await getTestByIdForStudent(req.params.id, req.user.sub)
            : await getTestById(req.params.id);

        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }
        
        // Only admins can see drafts
        if (test.status === 'draft' && req.user?.role !== 'admin') {
            return res.status(403).json({ message: "forbidden: draft tests only visible to admin" });
        }

        return res.status(200).json(test);
    } catch (error) {
        console.error("getTest error:", error.message);
        return res.status(500).json({ message: "failed to fetch test", error: error.message });
    }
}

export async function handleCreateTest(req, res) {
    try {
        const {
            title, format, durationMinutes, totalMarks,
            scheduleDate, scheduleTime, instructions,
            status, batchIds, questions
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "test title is required" });
        }

        if (!isPositiveNumber(durationMinutes)) {
            return res.status(400).json({ message: "test duration is required" });
        }

        if (!isPositiveNumber(totalMarks)) {
            return res.status(400).json({ message: "total marks is required" });
        }

        const test = await createTest({
            title: title.trim(),
            format,
            durationMinutes: Number(durationMinutes),
            totalMarks: Number(totalMarks),
            scheduleDate,
            scheduleTime,
            instructions,
            status: status || 'upcoming',
            batchIds,
            questions,
            createdBy: req.user?.sub || null,
        });

        // Trigger Notification if not a draft
        if (test.status !== 'draft' && batchIds && batchIds.length > 0) {
            createMultiBatchNotification(batchIds, {
                senderId: req.user.sub,
                type: 'test',
                title: test.status === 'live' ? 'Test is now LIVE' : 'New Test Scheduled',
                message: test.status === 'live'
                    ? `The test "${test.title}" is now LIVE. Good luck!`
                    : `New test "${test.title}" scheduled for ${test.schedule_date} at ${test.schedule_time}.`,
                metadata: { testId: test.id }
            }).catch(err => console.error("Auto-notification failed:", err));
        }

        return res.status(201).json(test);
    } catch (error) {
        if (error?.code === "INVALID_BATCH_ASSIGNMENT") {
            return res.status(400).json({ message: error.message });
        }
        console.error("createTest error:", error.message);
        return res.status(500).json({ message: "failed to create test", error: error.message });
    }
}

export async function handleUpdateTest(req, res) {
    try {
        const {
            title, format, durationMinutes, totalMarks,
            scheduleDate, scheduleTime, instructions,
            batchIds, questions
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "test title is required" });
        }

        if (!isPositiveNumber(durationMinutes)) {
            return res.status(400).json({ message: "test duration is required" });
        }

        if (!isPositiveNumber(totalMarks)) {
            return res.status(400).json({ message: "total marks is required" });
        }

        const test = await updateTest(req.params.id, {
            title: title.trim(),
            format,
            durationMinutes: Number(durationMinutes),
            totalMarks: Number(totalMarks),
            scheduleDate,
            scheduleTime,
            instructions,
            batchIds,
            questions
        });

        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }

        // Trigger Notification if not a draft
        if (test.status !== 'draft' && batchIds && batchIds.length > 0) {
            createMultiBatchNotification(batchIds, {
                senderId: req.user.sub,
                type: 'test',
                title: 'Test Updated',
                message: `Test "${test.title}" details updated. Scheduled for ${test.schedule_date} at ${test.schedule_time}.`,
                metadata: { testId: test.id }
            }).catch(err => console.error("Auto-notification failed:", err));
        }

        return res.status(200).json(test);
    } catch (error) {
        if (error?.code === "INVALID_BATCH_ASSIGNMENT") {
            return res.status(400).json({ message: error.message });
        }
        console.error("updateTest error:", error.message);
        return res.status(500).json({ message: "failed to update test", error: error.message });
    }
}

export async function handleUpdateTestStatus(req, res) {
    try {
        const { status, forceLiveNow = false } = req.body;
        if (!['draft', 'upcoming', 'live'].includes(status)) {
            return res.status(400).json({ message: "invalid status" });
        }
        const test = await updateTestStatus(req.params.id, status, {
            forceLiveNow: Boolean(forceLiveNow),
        });
        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }

        // Trigger Notification if transitioning out of draft
        const batchIds = (test.batches || []).map(b => b.id);
        if (test.status !== 'draft' && batchIds.length > 0) {
            createMultiBatchNotification(batchIds, {
                senderId: req.user.sub,
                type: 'test',
                title: test.status === 'live' ? 'Test is now LIVE' : 'Test Scheduled',
                message: test.status === 'live' 
                    ? `The test "${test.title}" is now LIVE. Good luck!`
                    : `The test "${test.title}" is scheduled for ${test.schedule_date} at ${test.schedule_time}.`,
                metadata: { testId: test.id }
            }).catch(err => console.error("Auto-notification failed:", err));
        }

        return res.status(200).json(test);
    } catch (error) {
        if (error?.code === "FORCE_LIVE_DRAFT_NOT_ALLOWED") {
            return res.status(409).json({ message: "draft tests cannot be forced live" });
        }
        if (error?.code === "TEST_ALREADY_LIVE") {
            return res.status(409).json({ message: "test is already live" });
        }
        if (error?.code === "FORCE_LIVE_NOT_ALLOWED" || error?.code === "INVALID_FORCE_LIVE_STATUS") {
            return res.status(400).json({ message: error.message });
        }
        console.error("updateTestStatus error:", error.message);
        return res.status(500).json({ message: "failed to update test status", error: error.message });
    }
}

export async function handleDeleteTest(req, res) {
    try {
        const deleted = await deleteTest(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json({ message: "test deleted" });
    } catch (error) {
        console.error("deleteTest error:", error.message);
        return res.status(500).json({ message: "failed to delete test", error: error.message });
    }
}

export async function listMyAttemptResults(req, res) {
    try {
        const results = await getStudentAttemptResults(req.user.sub);
        return res.status(200).json(results);
    } catch (error) {
        console.error("listMyAttemptResults error:", error.message);
        return res.status(500).json({ message: "failed to fetch attempt results", error: error.message });
    }
}

export async function getMyTestAttemptSummary(req, res) {
    try {
        const summary = await getStudentAttemptSummary(req.params.id, req.user.sub);
        if (!summary) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json(summary);
    } catch (error) {
        console.error("getMyTestAttemptSummary error:", error.message);
        return res.status(500).json({ message: "failed to fetch attempt summary", error: error.message });
    }
}

export async function startMyTestAttempt(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        const payload = await startOrResumeStudentAttempt(req.params.id, req.user.sub, deviceId);
        if (!payload) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json(payload);
    } catch (error) {
        if (error?.code === "ATTEMPT_LIMIT_REACHED") {
            return res.status(409).json({ message: "maximum attempts reached" });
        }
        if (error?.code === "TEST_NOT_LIVE") {
            return res.status(409).json({ message: "test is not live" });
        }
        if (error?.code === "SESSION_ACTIVE_OTHER_DEVICE") {
            return res.status(409).json({ message: "session active on another device" });
        }
        if (error?.code === "ANOTHER_TEST_ACTIVE") {
            return res.status(409).json({ message: "another test is already active. finish it before starting a new one." });
        }
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("startMyTestAttempt error:", error.message);
        return res.status(500).json({ message: "failed to start attempt", error: error.message });
    }
}

export async function saveMyAttemptProgress(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        const attempt = await saveStudentAttemptProgress(req.params.attemptId, req.user.sub, req.body?.answers || {}, deviceId);
        if (!attempt) {
            return res.status(404).json({ message: "active attempt not found" });
        }
        return res.status(200).json(attempt);
    } catch (error) {
        if (error?.code === "SESSION_ACTIVE_OTHER_DEVICE") {
            return res.status(409).json({ message: "session active on another device" });
        }
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("saveMyAttemptProgress error:", error.message);
        return res.status(500).json({ message: "failed to save attempt progress", error: error.message });
    }
}

export async function submitMyAttempt(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        const result = await submitStudentAttempt(req.params.attemptId, req.user.sub, {
            answers: req.body?.answers || {},
            autoSubmitted: Boolean(req.body?.autoSubmitted),
            deviceId,
        });
        if (!result) {
            return res.status(404).json({ message: "active attempt not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        if (error?.code === "SESSION_ACTIVE_OTHER_DEVICE") {
            return res.status(409).json({ message: "session active on another device" });
        }
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("submitMyAttempt error:", error.message);
        return res.status(500).json({ message: "failed to submit attempt", error: error.message });
    }
}

export async function getAttemptResult(req, res) {
    try {
        const result = await getAttemptResultForUser(req.params.attemptId, req.user);
        if (!result) {
            return res.status(404).json({ message: "attempt not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("getAttemptResult error:", error.message);
        return res.status(500).json({ message: "failed to fetch attempt result", error: error.message });
    }
}

export async function getAttemptQuestionExplanation(req, res) {
    try {
        const result = await getAttemptQuestionExplanationForUser(req.params.attemptId, req.params.questionId, req.user);
        if (!result) {
            return res.status(404).json({ message: "question explanation not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("getAttemptQuestionExplanation error:", error.message);
        return res.status(500).json({ message: "failed to fetch question explanation", error: error.message });
    }
}

export async function getTestAnalysis(req, res) {
    try {
        const test = await getTestById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }

        if (test.status === "draft" && req.user?.role !== "admin") {
            return res.status(403).json({ message: "forbidden: draft tests only visible to admin" });
        }

        const performances = await getTestAttemptAnalysis(req.params.id, req.query.search);
        return res.status(200).json({
            testId: req.params.id,
            performances,
        });
    } catch (error) {
        console.error("getTestAnalysis error:", error.message);
        return res.status(500).json({ message: "failed to fetch test analysis", error: error.message });
    }
}
