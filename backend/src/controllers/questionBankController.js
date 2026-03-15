import crypto from "crypto";
import {
    createQuestionBankFile,
    getFacultyQuestionBankContext,
    listFacultyQuestionBankFiles,
    listStudentQuestionBankFiles,
    removeQuestionBankFileFromBatch,
} from "../services/questionBankService.js";
import {
    deleteQuestionBankFileFromStorage,
    uploadQuestionBankFileToStorage,
} from "../services/storageService.js";

function normalizeDifficulty(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
        return normalized;
    }
    return null;
}

function normalizeBatchIds(rawValue) {
    if (Array.isArray(rawValue)) {
        return rawValue.map((value) => String(value).trim()).filter(Boolean);
    }
    if (typeof rawValue === "string") {
        return rawValue
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
    }
    return [];
}

export async function handleGetQuestionBank(req, res) {
    try {
        const { batch_id, subject_name, search, sort } = req.query;

        if (req.user?.role === "faculty") {
            const payload = await listFacultyQuestionBankFiles({
                facultyUserId: req.user.sub,
                batchId: batch_id,
                search: search || "",
                sort: sort || "newest",
            });
            return res.json(payload);
        }

        if (req.user?.role === "student") {
            const payload = await listStudentQuestionBankFiles({
                studentUserId: req.user.sub,
                subjectName: subject_name,
                search: search || "",
                sort: sort || "newest",
            });
            return res.json(payload);
        }

        return res.status(403).json({ message: "forbidden" });
    } catch (error) {
        if (error.code === "FORBIDDEN_BATCH") {
            return res.status(403).json({ message: "forbidden" });
        }
        console.error("Error fetching question bank:", error);
        return res.status(500).json({ message: "Failed to fetch question bank." });
    }
}

export async function handleUploadQuestionBankFile(req, res) {
    try {
        if (req.user?.role !== "faculty") {
            return res.status(403).json({ message: "forbidden" });
        }

        const { title } = req.body;
        const difficulty = normalizeDifficulty(req.body?.difficulty);
        const batchIds = Array.from(new Set(normalizeBatchIds(req.body?.batch_ids)));

        if (!title?.trim() || !difficulty || batchIds.length === 0) {
            return res.status(400).json({ message: "Missing required fields (title, difficulty, batch_ids)." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "A single file is required." });
        }

        const context = await getFacultyQuestionBankContext(req.user.sub);
        if (!context) {
            return res.status(403).json({ message: "forbidden" });
        }

        const accessibleBatchIds = new Set(context.accessibleBatches.map((batch) => batch.id));
        const allBatchesAllowed = batchIds.every((batchId) => accessibleBatchIds.has(batchId));
        if (!allBatchesAllowed) {
            return res.status(403).json({ message: "forbidden" });
        }

        const fileId = crypto.randomUUID();
        const fileUrl = await uploadQuestionBankFileToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            context.subject_name,
            fileId
        );

        const file = await createQuestionBankFile({
            id: fileId,
            subjectName: context.subject_name,
            title: title.trim(),
            difficulty,
            fileUrl,
            originalFileName: req.file.originalname,
            createdBy: req.user.sub,
            batchIds,
        });

        return res.status(201).json(file);
    } catch (error) {
        console.error("Error uploading question bank file:", error);
        return res.status(500).json({ message: error.message || "Failed to upload question bank file." });
    }
}

export async function handleDeleteQuestionBankBatchLink(req, res) {
    try {
        if (req.user?.role !== "faculty") {
            return res.status(403).json({ message: "forbidden" });
        }

        const deleted = await removeQuestionBankFileFromBatch({
            facultyUserId: req.user.sub,
            fileId: req.params.fileId,
            batchId: req.params.batchId,
        });

        if (!deleted) {
            return res.status(404).json({ message: "Question bank file not found." });
        }

        if (deleted.shouldDeleteStorage) {
            await deleteQuestionBankFileFromStorage(deleted.fileUrl);
        }

        return res.json({
            deleted: true,
            removed_batch_id: req.params.batchId,
            removed_file_id: req.params.fileId,
        });
    } catch (error) {
        console.error("Error deleting question bank file link:", error);
        return res.status(500).json({ message: error.message || "Failed to delete question bank file." });
    }
}
