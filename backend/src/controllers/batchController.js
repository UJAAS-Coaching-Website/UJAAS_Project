import {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    permanentlyDeleteBatch,
    assignStudentToBatch,
    removeStudentFromBatch,
    assignFacultyToBatch,
    removeFacultyFromBatch,
    getBatchStudents,
    getBatchFaculty,
    createBatchNotification,
    isFacultyAssignedToBatch,
} from "../services/batchService.js";
import { removeSubjectFromBatch } from "../services/subjectService.js";
import { uploadTimetableToStorage, deleteTimetableFromStorage } from "../services/storageService.js";

export async function listBatches(req, res) {
    try {
        const batches = await getAllBatches();
        return res.status(200).json(batches);
    } catch (error) {
        console.error("listBatches error:", error.message);
        return res.status(500).json({ message: "failed to fetch batches", error: error.message });
    }
}

export async function getBatch(req, res) {
    try {
        const batch = await getBatchById(req.params.id);
        if (!batch) {
            return res.status(404).json({ message: "batch not found" });
        }
        return res.status(200).json(batch);
    } catch (error) {
        console.error("getBatch error:", error.message);
        return res.status(500).json({ message: "failed to fetch batch", error: error.message });
    }
}

export async function handleCreateBatch(req, res) {
    try {
        const { name, subjects, facultyIds, timetable_url } = req.body;
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "batch name is required" });
        }
        const batch = await createBatch({
            name: name.trim(),
            subjects,
            facultyIds,
            timetable_url,
        });
        return res.status(201).json(batch);
    } catch (error) {
        console.error("createBatch error:", error.message);
        if (error.code === "23505") {
            return res.status(409).json({ message: "a batch with this name already exists" });
        }
        if (error.code === "INVALID_BATCH_FACULTY_ASSIGNMENT") {
            return res.status(400).json({ message: "Selected faculty could not be assigned to this batch. Refresh and try again." });
        }
        return res.status(500).json({ message: "failed to create batch", error: error.message });
    }
}

export async function handleUpdateBatch(req, res) {
    try {
        const { name, is_active, subjects, facultyIds, timetable_url } = req.body;
        const batch = await updateBatch(req.params.id, {
            name,
            is_active,
            subjects,
            facultyIds,
            timetable_url,
        });
        if (!batch) {
            return res.status(404).json({ message: "batch not found" });
        }
        return res.status(200).json(batch);
    } catch (error) {
        console.error("updateBatch error:", error.message);
        if (error.code === "23505") {
            return res.status(409).json({ message: "a batch with this name already exists" });
        }
        if (error.code === "INVALID_BATCH_FACULTY_ASSIGNMENT") {
            return res.status(400).json({ message: "Selected faculty could not be assigned to this batch. Refresh and try again." });
        }
        return res.status(500).json({ message: "failed to update batch", error: error.message });
    }
}

export async function handleDeleteBatch(req, res) {
    try {
        const deleted = await deleteBatch(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "batch not found" });
        }
        return res.status(200).json({ message: "batch deleted" });
    } catch (error) {
        console.error("deleteBatch error:", error.message);
        return res.status(500).json({ message: "failed to delete batch", error: error.message });
    }
}

export async function handlePermanentDeleteBatch(req, res) {
    try {
        const summary = await permanentlyDeleteBatch(req.params.id);
        return res.status(200).json({
            message: "batch permanently deleted",
            summary,
        });
    } catch (error) {
        if (error?.code === "BATCH_NOT_FOUND") {
            return res.status(404).json({ message: error.message });
        }
        if (error?.code === "BATCH_NOT_INACTIVE") {
            return res.status(409).json({ message: error.message });
        }
        console.error("permanentDeleteBatch error:", error.message);
        return res.status(500).json({ message: "failed to permanently delete batch", error: error.message });
    }
}

export async function handleAssignStudent(req, res) {
    try {
        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: "studentId is required" });
        }
        await assignStudentToBatch(studentId, req.params.id);
        return res.status(200).json({ message: "student assigned to batch" });
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "BATCH_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("assignStudent error:", error.message);
        return res.status(500).json({ message: "failed to assign student", error: error.message });
    }
}

export async function handleRemoveStudent(req, res) {
    try {
        const removed = await removeStudentFromBatch(req.params.studentId, req.params.id);
        if (!removed) {
            return res.status(404).json({ message: "student not found in batch" });
        }
        return res.status(200).json({ message: "student removed from batch" });
    } catch (error) {
        console.error("removeStudent error:", error.message);
        return res.status(500).json({ message: "failed to remove student", error: error.message });
    }
}

export async function handleAssignFaculty(req, res) {
    try {
        const { facultyId } = req.body;
        if (!facultyId) {
            return res.status(400).json({ message: "facultyId is required" });
        }
        await assignFacultyToBatch(facultyId, req.params.id);
        return res.status(200).json({ message: "faculty assigned to batch" });
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "BATCH_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("assignFaculty error:", error.message);
        return res.status(500).json({ message: "failed to assign faculty", error: error.message });
    }
}

export async function handleRemoveFaculty(req, res) {
    try {
        const removed = await removeFacultyFromBatch(req.params.facultyId, req.params.id);
        if (!removed) {
            return res.status(404).json({ message: "faculty not found in batch" });
        }
        return res.status(200).json({ message: "faculty removed from batch" });
    } catch (error) {
        console.error("removeFaculty error:", error.message);
        return res.status(500).json({ message: "failed to remove faculty", error: error.message });
    }
}

export async function handleGetBatchStudents(req, res) {
    try {
        const students = await getBatchStudents(req.params.id);
        return res.status(200).json(students);
    } catch (error) {
        console.error("getBatchStudents error:", error.message);
        return res.status(500).json({ message: "failed to fetch batch students", error: error.message });
    }
}

export async function handleGetBatchFaculty(req, res) {
    try {
        const faculty = await getBatchFaculty(req.params.id);
        return res.status(200).json(faculty);
    } catch (error) {
        console.error("getBatchFaculty error:", error.message);
        return res.status(500).json({ message: "failed to fetch batch faculty", error: error.message });
    }
}

export async function handleCreateBatchNotification(req, res) {
    try {
        const { title, message, type } = req.body;
        const batchId = req.params.id;

        if (!title || !message) {
            return res.status(400).json({ message: "notice title and message are required" });
        }

        // Security check for faculty
        if (req.user.role === 'faculty') {
            const assigned = await isFacultyAssignedToBatch(req.user.sub, batchId);
            if (!assigned) {
                return res.status(403).json({ message: "you are not assigned to this batch" });
            }
        }

        await createBatchNotification(batchId, { title, message, type });
        return res.status(201).json({ message: "notice sent successfully" });
    } catch (error) {
        console.error("createBatchNotification error:", error.message);
        return res.status(500).json({ message: "failed to send notice", error: error.message });
    }
}

export async function handleRemoveBatchSubject(req, res) {
    try {
        const { id: batchId, subjectId } = req.params;
        const result = await removeSubjectFromBatch(batchId, subjectId);
        if (!result.ok) {
            return res.status(409).json({ ok: false, reason: "linked", links: result.links });
        }
        return res.status(200).json({ ok: true, action: result.action });
    } catch (error) {
        if (error?.code === "SUBJECT_NOT_FOUND" || error?.code === "BATCH_SUBJECT_NOT_FOUND") {
            return res.status(404).json({ message: error.message });
        }
        if (error?.code === "SUBJECTS_UNSUPPORTED") {
            return res.status(400).json({ message: error.message });
        }
        console.error("removeBatchSubject error:", error.message);
        return res.status(500).json({ message: "failed to remove subject from batch" });
    }
}

export async function handleUploadBatchTimetable(req, res) {
    try {
        const batchId = req.params.id;
        const batch = await getBatchById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "batch not found" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No timetable file provided." });
        }

        if (batch.timetable_url) {
            await deleteTimetableFromStorage(batch.timetable_url);
        }

        const timetableUrl = await uploadTimetableToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            batchId
        );

        const updated = await updateBatch(batchId, { timetable_url: timetableUrl });
        return res.status(200).json(updated);
    } catch (error) {
        console.error("uploadBatchTimetable error:", error.message);
        return res.status(500).json({ message: "failed to upload timetable", error: error.message });
    }
}

export async function handleDeleteBatchTimetable(req, res) {
    try {
        const batchId = req.params.id;
        const batch = await getBatchById(batchId);
        if (!batch) {
            return res.status(404).json({ message: "batch not found" });
        }

        if (batch.timetable_url) {
            await deleteTimetableFromStorage(batch.timetable_url);
        }

        const updated = await updateBatch(batchId, { timetable_url: null });
        return res.status(200).json(updated);
    } catch (error) {
        console.error("deleteBatchTimetable error:", error.message);
        return res.status(500).json({ message: "failed to delete timetable", error: error.message });
    }
}
