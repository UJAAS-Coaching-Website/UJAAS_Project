import * as noteService from "../services/noteService.js";
import { deleteNoteFromStorage, uploadNoteToStorage } from "../services/storageService.js";
import { getFacultyManagedChapter, getFacultyManagedNote } from "../services/contentAccessService.js";
import crypto from "crypto";

export const handleGetNotes = async (req, res) => {
    try {
        const { chapter_id } = req.query;
        if (!chapter_id) {
            return res.status(400).json({ message: "chapter_id query parameter is required." });
        }
        const notes = await noteService.getNotesByChapter(chapter_id);
        res.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ message: "Failed to fetch notes." });
    }
};

export const handleGetNoteById = async (req, res) => {
    try {
        const note = await noteService.getNoteById(req.params.id);
        if (!note) return res.status(404).json({ message: "Note not found." });
        res.json(note);
    } catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ message: "Failed to fetch note." });
    }
};

export const handleCreateNote = async (req, res) => {
    try {
        const { chapter_id, title, file_url } = req.body;
        if (!chapter_id || !title || !file_url) {
            return res.status(400).json({ message: "Missing required fields (chapter_id, title, file_url)." });
        }
        const chapter = await getFacultyManagedChapter(chapter_id, req.user.sub);
        if (!chapter) {
            return res.status(403).json({ message: "forbidden" });
        }
        const note = await noteService.createNote(req.body);
        res.status(201).json(note);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Failed to create note." });
    }
};

export const handleUploadNote = async (req, res) => {
    try {
        const { chapter_id, title } = req.body;

        if (!chapter_id || !title?.trim()) {
            return res.status(400).json({ message: "Missing required fields (chapter_id, title)." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "A single file is required." });
        }

        const chapter = await getFacultyManagedChapter(chapter_id, req.user.sub);
        if (!chapter) {
            return res.status(403).json({ message: "forbidden" });
        }

        const noteId = crypto.randomUUID();
        const fileUrl = await uploadNoteToStorage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            chapter,
            noteId
        );

        const note = await noteService.createNote({
            id: noteId,
            chapter_id,
            title: title.trim(),
            file_url: fileUrl,
        });

        res.status(201).json(note);
    } catch (error) {
        console.error("Error uploading note:", error);
        res.status(500).json({ message: error.message || "Failed to upload note." });
    }
};

export const handleUpdateNote = async (req, res) => {
    try {
        const existingNote = await getFacultyManagedNote(req.params.id, req.user.sub);
        if (!existingNote) {
            return res.status(403).json({ message: "forbidden" });
        }
        const note = await noteService.updateNote(req.params.id, req.body);
        if (!note) return res.status(404).json({ message: "Note not found." });
        res.json(note);
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ message: "Failed to update note." });
    }
};

export const handleDeleteNote = async (req, res) => {
    try {
        const existingNote = await getFacultyManagedNote(req.params.id, req.user.sub);
        if (!existingNote) return res.status(403).json({ message: "forbidden" });

        await deleteNoteFromStorage(existingNote.file_url);
        await noteService.deleteNote(req.params.id);
        res.json({ message: "Note deleted successfully." });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ message: "Failed to delete note." });
    }
};
