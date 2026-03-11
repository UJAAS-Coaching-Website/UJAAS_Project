import * as chapterService from "../services/chapterService.js";

export const handleGetChapters = async (req, res) => {
    try {
        const { batch_id, subject_name } = req.query;
        const chapters = await chapterService.getChapters(batch_id, subject_name);
        res.json(chapters);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        res.status(500).json({ message: "Failed to fetch chapters." });
    }
};

export const handleGetChapterById = async (req, res) => {
    try {
        const chapter = await chapterService.getChapterById(req.params.id);
        if (!chapter) return res.status(404).json({ message: "Chapter not found." });
        res.json(chapter);
    } catch (error) {
        console.error("Error fetching chapter:", error);
        res.status(500).json({ message: "Failed to fetch chapter." });
    }
};

export const handleCreateChapter = async (req, res) => {
    try {
        const { batch_id, subject_name, name } = req.body;
        if (!batch_id || !subject_name || !name) {
            return res.status(400).json({ message: "Missing required fields (batch_id, subject_name, name)." });
        }
        const chapter = await chapterService.createChapter(req.body);
        res.status(201).json(chapter);
    } catch (error) {
        console.error("Error creating chapter:", error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ message: "Chapter already exists for this subject in the given batch." });
        }
        res.status(500).json({ message: "Failed to create chapter." });
    }
};

export const handleUpdateChapter = async (req, res) => {
    try {
        const chapter = await chapterService.updateChapter(req.params.id, req.body);
        if (!chapter) return res.status(404).json({ message: "Chapter not found." });
        res.json(chapter);
    } catch (error) {
        console.error("Error updating chapter:", error);
        res.status(500).json({ message: "Failed to update chapter." });
    }
};

export const handleDeleteChapter = async (req, res) => {
    try {
        const chapter = await chapterService.deleteChapter(req.params.id);
        if (!chapter) return res.status(404).json({ message: "Chapter not found." });
        res.json({ message: "Chapter deleted successfully." });
    } catch (error) {
        console.error("Error deleting chapter:", error);
        res.status(500).json({ message: "Failed to delete chapter." });
    }
};
