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
        const students = await getAllStudents();
        return res.status(200).json(students);
    } catch (error) {
        console.error("listStudents error:", error.message);
        return res.status(500).json({ message: "failed to fetch students", error: error.message });
    }
}

export async function getStudent(req, res) {
    try {
        const student = await getStudentById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: "student not found" });
        }
        return res.status(200).json(student);
    } catch (error) {
        console.error("getStudent error:", error.message);
        return res.status(500).json({ message: "failed to fetch student", error: error.message });
    }
}

export async function handleCreateStudent(req, res) {
    try {
        const { name, rollNumber, phone, address, dateOfBirth, parentContact, batchId } = req.body;
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "student name is required" });
        }
        if (!rollNumber || typeof rollNumber !== "string" || !rollNumber.trim()) {
            return res.status(400).json({ message: "roll number is required" });
        }
        const student = await createStudent({
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            parentContact: parentContact || null,
            batchId: batchId || null,
        });
        return res.status(201).json(student);
    } catch (error) {
        console.error("createStudent error:", error.message);
        if (error.code === "23505") {
            return res.status(409).json({ message: "a student with this roll number already exists" });
        }
        return res.status(500).json({ message: "failed to create student", error: error.message });
    }
}

export async function handleUpdateStudent(req, res) {
    try {
        const { name, rollNumber, phone, address, dateOfBirth, parentContact } = req.body;
        const student = await updateStudent(req.params.id, {
            name,
            rollNumber,
            phone,
            address,
            dateOfBirth,
            parentContact,
        });
        if (!student) {
            return res.status(404).json({ message: "student not found" });
        }
        return res.status(200).json(student);
    } catch (error) {
        console.error("updateStudent error:", error.message);
        if (error.code === "23505") {
            return res.status(409).json({ message: "a student with this roll number already exists" });
        }
        return res.status(500).json({ message: "failed to update student", error: error.message });
    }
}

export async function handleDeleteStudent(req, res) {
    try {
        const deleted = await deleteStudent(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "student not found" });
        }
        return res.status(200).json({ message: "student deleted" });
    } catch (error) {
        console.error("deleteStudent error:", error.message);
        return res.status(500).json({ message: "failed to delete student", error: error.message });
    }
}

export async function handleAssignStudentToBatch(req, res) {
    try {
        const { batchId } = req.body;
        if (!batchId) {
            return res.status(400).json({ message: "batchId is required" });
        }
        const student = await assignStudentToBatch(req.params.id, batchId);
        if (!student) {
            return res.status(404).json({ message: "student not found" });
        }
        return res.status(200).json(student);
    } catch (error) {
        console.error("assignStudentToBatch error:", error.message);
        return res.status(500).json({ message: "failed to assign student to batch", error: error.message });
    }
}

export async function handleRemoveStudentFromBatch(req, res) {
    try {
        const removed = await removeStudentFromBatch(req.params.id, req.params.batchId);
        if (!removed) {
            return res.status(404).json({ message: "student not found in batch" });
        }
        return res.status(200).json({ message: "student removed from batch" });
    } catch (error) {
        console.error("removeStudentFromBatch error:", error.message);
        return res.status(500).json({ message: "failed to remove student from batch", error: error.message });
    }
}

export async function handleUpdateStudentRating(req, res) {
    try {
        const { subject, attendance, total_classes, assignments, participation, behavior } = req.body;
        const rating = await updateStudentRating(req.params.id, subject, {
            attendance,
            total_classes,
            assignments,
            participation,
            behavior
        });
        return res.status(200).json(rating);
    } catch (error) {
        console.error("handleUpdateStudentRating error:", error.message);
        return res.status(500).json({ message: "failed to update student rating", error: error.message });
    }
}
