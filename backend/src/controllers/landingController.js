import { getLandingData, updateFullLandingData } from "../services/landingService.js";

export async function getPublicLandingData(req, res) {
    try {
        const data = await getLandingData();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: "failed to load landing data", error: error.message });
    }
}

export async function updateLandingData(req, res) {
    try {
        const data = req.body;
        if (!data || typeof data !== "object") {
            return res.status(400).json({ message: "invalid landing data" });
        }
        const updated = await updateFullLandingData(data);
        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: "failed to update landing data", error: error.message });
    }
}
