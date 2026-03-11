import { getAllFaculties, createFaculty, updateFaculty, deleteFaculty } from "../services/facultyService.js";

export async function listFaculties(req, res) {
    try {
        const faculties = await getAllFaculties();
        return res.status(200).json(faculties);
    } catch (error) {
        console.error("listFaculties error:", error.message);
        return res.status(500).json({ message: "failed to fetch faculties", error: error.message });
    }
}

export async function handleCreateFaculty(req, res) {
    try {
        const { name, email, subject, phone, designation, joinDate } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "faculty name is required" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "email/login ID is required" });
        }
        const faculty = await createFaculty({
            name: name.trim(),
            email: email.trim(),
            subject, phone, designation, joinDate,
        });
        return res.status(201).json(faculty);
    } catch (error) {
        console.error("createFaculty error:", error.message);
        if (error.code === "23505") {
            return res.status(409).json({ message: "a faculty with this email already exists" });
        }
        return res.status(500).json({ message: "failed to create faculty", error: error.message });
    }
}

export async function handleUpdateFaculty(req, res) {
    try {
        const faculty = await updateFaculty(req.params.id, req.body);
        if (!faculty) {
            return res.status(404).json({ message: "faculty not found" });
        }
        return res.status(200).json(faculty);
    } catch (error) {
        console.error("updateFaculty error:", error.message);
        return res.status(500).json({ message: "failed to update faculty", error: error.message });
    }
}

export async function handleDeleteFaculty(req, res) {
    try {
        const deleted = await deleteFaculty(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "faculty not found" });
        }
        return res.status(200).json({ message: "faculty deleted" });
    } catch (error) {
        console.error("deleteFaculty error:", error.message);
        return res.status(500).json({ message: "failed to delete faculty", error: error.message });
    }
}
