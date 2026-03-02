import { fetchUserProfileById, updateStudentProfile } from "../services/userService.js";

export async function updateProfile(req, res) {
    const { name, phone, address, dateOfBirth, parentContact } = req.body || {};
    const normalizedName = String(name ?? "").trim();

    if (!normalizedName) {
        return res.status(400).json({ message: "name is required" });
    }

    try {
        const user = await updateStudentProfile(req.user.sub, {
            name: normalizedName,
            phone,
            address,
            dateOfBirth,
            parentContact,
        });

        if (!user) {
            return res.status(404).json({ message: "student profile not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "failed to update profile", error: error.message });
    }
}
