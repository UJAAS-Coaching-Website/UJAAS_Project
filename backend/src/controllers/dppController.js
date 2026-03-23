import {
    listDpps,
    getDppByIdForUser,
    getStudentDppAttemptSummary,
    startStudentDppAttempt,
    submitStudentDppAttempt,
    closeStudentDppSession,
    getDppAttemptResultForUser,
    getDppAttemptQuestionExplanationForUser,
    getDppAttemptAnalysis,
    createDpp,
    updateDpp,
    deleteDpp,
} from "../services/dppService.js";
import { getFacultyManagedChapter, getFacultyManagedDpp } from "../services/contentAccessService.js";
import { createMultiBatchNotification } from "../services/notificationService.js";
import { getDeviceIdFromRequest } from "../utils/device.js";

export async function handleListDpps(req, res) {
    try {
        const dpps = await listDpps({ chapterId: req.query.chapter_id, user: req.user });
        return res.status(200).json(dpps);
    } catch (error) {
        console.error("handleListDpps error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpps", error: error.message });
    }
}

export async function handleGetDpp(req, res) {
    try {
        const dpp = await getDppByIdForUser(req.params.id, req.user);
        if (!dpp) {
            return res.status(404).json({ message: "dpp not found" });
        }
        return res.status(200).json(dpp);
    } catch (error) {
        console.error("handleGetDpp error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpp", error: error.message });
    }
}

export async function handleGetMyDppAttemptSummary(req, res) {
    try {
        const summary = await getStudentDppAttemptSummary(req.params.id, req.user.sub);
        if (!summary) {
            return res.status(404).json({ message: "dpp not found" });
        }
        return res.status(200).json(summary);
    } catch (error) {
        console.error("handleGetMyDppAttemptSummary error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpp attempt summary", error: error.message });
    }
}

export async function handleStartMyDppAttempt(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        const payload = await startStudentDppAttempt(req.params.id, req.user.sub, deviceId);
        if (!payload) {
            return res.status(404).json({ message: "dpp not found" });
        }
        return res.status(200).json(payload);
    } catch (error) {
        if (error?.code === "ATTEMPT_LIMIT_REACHED") {
            return res.status(409).json({ message: "maximum attempts reached" });
        }
        if (error?.code === "SESSION_ACTIVE_OTHER_DEVICE") {
            return res.status(409).json({ message: "session active on another device" });
        }
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("handleStartMyDppAttempt error:", error.message);
        return res.status(500).json({ message: "failed to start dpp attempt", error: error.message });
    }
}

export async function handleSubmitMyDppAttempt(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        const result = await submitStudentDppAttempt(req.params.id, req.user.sub, {
            answers: req.body?.answers || {},
            deviceId,
        });
        if (!result) {
            return res.status(404).json({ message: "dpp not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        if (error?.code === "ATTEMPT_LIMIT_REACHED") {
            return res.status(409).json({ message: "maximum attempts reached" });
        }
        if (error?.code === "SESSION_ACTIVE_OTHER_DEVICE") {
            return res.status(409).json({ message: "session active on another device" });
        }
        if (error?.code === "SESSION_NOT_FOUND") {
            return res.status(409).json({ message: "dpp session not found. start the dpp again." });
        }
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("handleSubmitMyDppAttempt error:", error.message);
        return res.status(500).json({ message: "failed to submit dpp attempt", error: error.message });
    }
}

export async function handleCloseMyDppSession(req, res) {
    try {
        const deviceId = getDeviceIdFromRequest(req);
        await closeStudentDppSession(req.params.id, req.user.sub, deviceId);
        return res.status(200).json({ status: "ok" });
    } catch (error) {
        if (error?.code === "DEVICE_ID_REQUIRED") {
            return res.status(400).json({ message: "device id required" });
        }
        console.error("handleCloseMyDppSession error:", error.message);
        return res.status(500).json({ message: "failed to close dpp session", error: error.message });
    }
}

export async function handleGetDppAttemptResult(req, res) {
    try {
        const result = await getDppAttemptResultForUser(req.params.attemptId, req.user);
        if (!result) {
            return res.status(404).json({ message: "attempt not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("handleGetDppAttemptResult error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpp attempt result", error: error.message });
    }
}

export async function handleGetDppAttemptQuestionExplanation(req, res) {
    try {
        const result = await getDppAttemptQuestionExplanationForUser(req.params.attemptId, req.params.questionId, req.user);
        if (!result) {
            return res.status(404).json({ message: "question explanation not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("handleGetDppAttemptQuestionExplanation error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpp question explanation", error: error.message });
    }
}

export async function handleGetDppAnalysis(req, res) {
    try {
        if (req.user.role === "faculty") {
            const managedDpp = await getFacultyManagedDpp(req.params.id, req.user.sub);
            if (!managedDpp) {
                return res.status(403).json({ message: "forbidden" });
            }
        }

        const analysis = await getDppAttemptAnalysis(req.params.id);
        return res.status(200).json(analysis);
    } catch (error) {
        console.error("handleGetDppAnalysis error:", error.message);
        return res.status(500).json({ message: "failed to fetch dpp analytics", error: error.message });
    }
}

export async function handleCreateDpp(req, res) {
    try {
        const { title, instructions, chapter_id, questions } = req.body;
        if (!title?.trim() || !chapter_id) {
            return res.status(400).json({ message: "title and chapter_id are required" });
        }

        const chapter = await getFacultyManagedChapter(chapter_id, req.user.sub);
        if (!chapter) {
            return res.status(403).json({ message: "forbidden" });
        }

        const dpp = await createDpp({
            title: title.trim(),
            instructions,
            chapterId: chapter_id,
            createdBy: req.user.sub,
            questions: Array.isArray(questions) ? questions : [],
        });

        // Trigger Notification
        if (chapter && chapter.batch_id) {
            createMultiBatchNotification([chapter.batch_id], {
                senderId: req.user.sub,
                type: 'dpp',
                title: 'New DPP Uploaded',
                message: `New DPP "${dpp.title}" uploaded for chapter "${chapter.name}" (${chapter.subject_name}).`,
                metadata: { dppId: dpp.id, chapterId: chapter.id }
            }).catch(err => console.error("DPP Auto-notification failed:", err));
        }

        return res.status(201).json(dpp);
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "CHAPTER_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("handleCreateDpp error:", error.message);
        return res.status(500).json({ message: "failed to create dpp", error: error.message });
    }
}

export async function handleUpdateDpp(req, res) {
    try {
        const managedDpp = await getFacultyManagedDpp(req.params.id, req.user.sub);
        if (!managedDpp) {
            return res.status(403).json({ message: "forbidden" });
        }

        const chapterId = req.body?.chapter_id || managedDpp.chapter_id;
        const chapter = await getFacultyManagedChapter(chapterId, req.user.sub);
        if (!chapter) {
            return res.status(403).json({ message: "forbidden" });
        }

        const updated = await updateDpp(req.params.id, {
            title: req.body?.title?.trim() || managedDpp.title,
            instructions: req.body?.instructions ?? managedDpp.instructions ?? null,
            chapterId,
            questions: Array.isArray(req.body?.questions) ? req.body.questions : [],
        });

        // Trigger Notification
        if (chapter && chapter.batch_id) {
            createMultiBatchNotification([chapter.batch_id], {
                senderId: req.user.sub,
                type: 'dpp',
                title: 'DPP Updated',
                message: `DPP "${updated.title}" updated for chapter "${chapter.name}" (${chapter.subject_name}).`,
                metadata: { dppId: updated.id, chapterId: chapter.id }
            }).catch(err => console.error("DPP Auto-notification failed:", err));
        }

        return res.status(200).json(updated);
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "CHAPTER_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("handleUpdateDpp error:", error.message);
        return res.status(500).json({ message: "failed to update dpp", error: error.message });
    }
}

export async function handleDeleteDpp(req, res) {
    try {
        const managedDpp = await getFacultyManagedDpp(req.params.id, req.user.sub);
        if (!managedDpp) {
            return res.status(403).json({ message: "forbidden" });
        }

        const deleted = await deleteDpp(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "dpp not found" });
        }
        return res.status(200).json({ message: "dpp deleted" });
    } catch (error) {
        console.error("handleDeleteDpp error:", error.message);
        return res.status(500).json({ message: "failed to delete dpp", error: error.message });
    }
}
