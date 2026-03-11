import { getAllTests, getTestById, createTest, updateTestStatus, updateTest, deleteTest } from "../services/testService.js";

export async function listTests(req, res) {
    try {
        const tests = await getAllTests();
        return res.status(200).json(tests);
    } catch (error) {
        console.error("listTests error:", error.message);
        return res.status(500).json({ message: "failed to fetch tests", error: error.message });
    }
}

export async function getTest(req, res) {
    try {
        const test = await getTestById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json(test);
    } catch (error) {
        console.error("getTest error:", error.message);
        return res.status(500).json({ message: "failed to fetch test", error: error.message });
    }
}

export async function handleCreateTest(req, res) {
    try {
        const {
            title, format, durationMinutes, totalMarks,
            scheduleDate, scheduleTime, instructions,
            batchIds, questions
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "test title is required" });
        }

        const test = await createTest({
            title: title.trim(),
            format,
            durationMinutes,
            totalMarks,
            scheduleDate,
            scheduleTime,
            instructions,
            status: 'upcoming',
            batchIds,
            questions,
            createdBy: req.user?.id || null,
        });

        return res.status(201).json(test);
    } catch (error) {
        console.error("createTest error:", error.message);
        return res.status(500).json({ message: "failed to create test", error: error.message });
    }
}

export async function handleUpdateTest(req, res) {
    try {
        const {
            title, format, durationMinutes, totalMarks,
            scheduleDate, scheduleTime, instructions,
            batchIds, questions
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "test title is required" });
        }

        const test = await updateTest(req.params.id, {
            title: title.trim(),
            format,
            durationMinutes,
            totalMarks,
            scheduleDate,
            scheduleTime,
            instructions,
            batchIds,
            questions
        });

        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }

        return res.status(200).json(test);
    } catch (error) {
        console.error("updateTest error:", error.message);
        return res.status(500).json({ message: "failed to update test", error: error.message });
    }
}

export async function handleUpdateTestStatus(req, res) {
    try {
        const { status } = req.body;
        if (!['upcoming', 'live', 'completed'].includes(status)) {
            return res.status(400).json({ message: "invalid status" });
        }
        const test = await updateTestStatus(req.params.id, status);
        if (!test) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json(test);
    } catch (error) {
        console.error("updateTestStatus error:", error.message);
        return res.status(500).json({ message: "failed to update test status", error: error.message });
    }
}

export async function handleDeleteTest(req, res) {
    try {
        const deleted = await deleteTest(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "test not found" });
        }
        return res.status(200).json({ message: "test deleted" });
    } catch (error) {
        console.error("deleteTest error:", error.message);
        return res.status(500).json({ message: "failed to delete test", error: error.message });
    }
}
