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
        const students = await getAllStudents(req.query.search);
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
        return res.status(500).json({ message: "failed to update student rating", error: error.message });
    }
}
