import {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    assignStudentToBatch,
    removeStudentFromBatch,
    updateStudentRating,
} from "../services/studentService.js";

export async function listStudents(req, res) {
    try {
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'name';
        const sortOrder = req.query.sortOrder || 'asc';
        const page = req.query.page;
        const limit = req.query.limit;
        const batch = req.query.batch;
        
        const students = await getAllStudents(search, sortBy, sortOrder, { page, limit, batch });
        return res.status(200).json(students);
    } catch (error) {
        console.error("listStudents error:", error.message);
        return res.status(500).json({ message: "failed to list students", error: error.message });
    }
}

export async function getStudent(req, res) {
    const { id } = req.params;
    try {
        const student = await getStudentById(id);
        if (!student) return res.status(404).json({ message: "student not found" });
        return res.status(200).json(student);
    } catch (error) {
        console.error("getStudent error:", error.message);
        return res.status(500).json({ message: "failed to get student", error: error.message });
    }
}

export async function handleCreateStudent(req, res) {
    try {
        const student = await createStudent(req.body);
        return res.status(201).json(student);
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "BATCH_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("handleCreateStudent error:", error.message);
        return res.status(500).json({ message: "failed to create student", error: error.message });
    }
}

export async function handleUpdateStudent(req, res) {
    const { id } = req.params;
    try {
        const student = await updateStudent(id, req.body);
        return res.status(200).json(student);
    } catch (error) {
        console.error("handleUpdateStudent error:", error.message);
        return res.status(500).json({ message: "failed to update student", error: error.message });
    }
}

export async function handleDeleteStudent(req, res) {
    const { id } = req.params;
    try {
        const ok = await deleteStudent(id);
        if (!ok) return res.status(404).json({ message: "student not found" });
        return res.status(200).json({ message: "student deleted" });
    } catch (error) {
        console.error("handleDeleteStudent error:", error.message);
        return res.status(500).json({ message: "failed to delete student", error: error.message });
    }
}

export async function handleAssignStudentToBatch(req, res) {
    const { id } = req.params;
    const { batchId } = req.body;
    try {
        const student = await assignStudentToBatch(id, batchId);
        return res.status(200).json(student);
    } catch (error) {
        if (error?.code === "BATCH_INACTIVE" || error?.code === "BATCH_NOT_FOUND") {
            return res.status(400).json({ message: error.message });
        }
        console.error("handleAssignStudentToBatch error:", error.message);
        return res.status(500).json({ message: "failed to assign student to batch", error: error.message });
    }
}

export async function handleRemoveStudentFromBatch(req, res) {
    const { id, batchId } = req.params;
    try {
        const ok = await removeStudentFromBatch(id, batchId);
        if (!ok) return res.status(404).json({ message: "student was not in this batch" });
        return res.status(200).json({ message: "student removed from batch" });
    } catch (error) {
        console.error("removeStudentFromBatch error:", error.message);
        return res.status(500).json({ message: "failed to remove student from batch", error: error.message });
    }
}

export async function handleUpdateStudentRating(req, res) {
    try {
        const { id } = req.params;
        const { subject, attendance, total_classes, tests, dppPerformance, behavior, remarks } = req.body;

        if (!subject || !String(subject).trim()) {
            return res.status(400).json({ message: "subject is required" });
        }
        
        const rating = await updateStudentRating(id, subject, {
            attendance,
            total_classes,
            tests,
            dppPerformance,
            behavior,
            remarks
        });
        
        return res.status(200).json(rating);
    } catch (error) {
        console.error("handleUpdateStudentRating error:", error.message);

        if (error?.message === "Student is not assigned to any batch") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: error?.message || "failed to update student rating" });
    }
}
