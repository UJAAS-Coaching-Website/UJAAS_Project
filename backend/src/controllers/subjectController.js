import { listSubjects, deleteSubjectGlobal } from "../services/subjectService.js";

export async function handleListSubjects(req, res) {
    try {
        const subjects = await listSubjects();
        return res.status(200).json(subjects);
    } catch (error) {
        console.error("listSubjects error:", error.message);
        return res.status(500).json({ message: "failed to fetch subjects" });
    }
}

export async function handleDeleteSubjectGlobal(req, res) {
    try {
        const result = await deleteSubjectGlobal(req.params.id);
        if (!result.ok) {
            return res.status(409).json({ ok: false, reason: "linked", links: result.links });
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        if (error?.code === "SUBJECT_NOT_FOUND") {
            return res.status(404).json({ message: "subject not found" });
        }
        console.error("deleteSubjectGlobal error:", error.message);
        return res.status(500).json({ message: "failed to delete subject" });
    }
}
