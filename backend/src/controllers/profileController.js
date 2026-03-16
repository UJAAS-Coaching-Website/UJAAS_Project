import { fetchUserProfileById, updateStudentProfile, updateUserAvatar } from "../services/userService.js";
import { uploadAvatarToStorage } from "../services/storageService.js";

export async function uploadAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }

        // Upload and process (compress) the avatar
        const avatarUrl = await uploadAvatarToStorage(req.file.buffer, req.user.sub);

        // Update the user's avatar_url in the database
        await updateUserAvatar(req.user.sub, avatarUrl);

        return res.status(200).json({ 
            status: 'success', 
            avatarUrl 
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(500).json({ message: "failed to upload avatar", error: error.message });
    }
}

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
