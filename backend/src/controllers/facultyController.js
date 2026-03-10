import { getAllFaculties } from "../services/facultyService.js";

export async function listFaculties(req, res) {
    try {
        const faculties = await getAllFaculties();
        return res.status(200).json(faculties);
    } catch (error) {
        console.error("listFaculties error:", error.message);
        return res.status(500).json({ message: "failed to fetch faculties", error: error.message });
    }
}
