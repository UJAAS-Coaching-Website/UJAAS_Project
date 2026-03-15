import { getAllQueries, createQuery, updateQueryStatus } from "../services/queryService.js";

export async function listQueries(req, res) {
    try {
        const queries = await getAllQueries();
        return res.status(200).json({ queries });
    } catch (error) {
        return res.status(500).json({ message: "failed to load queries", error: error.message });
    }
}

export async function submitQuery(req, res) {
    const { name, email, phone, courseId, message } = req.body || {};
    if (!name || !email || !phone || !courseId) {
        return res.status(400).json({ message: "name, email, phone, and courseId are required" });
    }
    try {
        const query = await createQuery({ name, email, phone, courseId, message });
        return res.status(201).json(query);
    } catch (error) {
        return res.status(500).json({ message: "failed to submit query", error: error.message });
    }
}

export async function patchQueryStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) {
        return res.status(400).json({ message: "status is required" });
    }
    try {
        const result = await updateQueryStatus(id, status);
        if (!result) {
            return res.status(404).json({ message: "query not found" });
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
