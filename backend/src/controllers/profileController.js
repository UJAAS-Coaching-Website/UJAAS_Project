import { fetchUserProfileById, updateStudentProfile, updateUserAvatar } from "../services/userService.js";
import { deleteAvatarFromStorage, uploadAvatarToStorage } from "../services/storageService.js";

export async function uploadAvatar(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }

        const user = await fetchUserProfileById(req.user.sub);
        const previousAvatarUrl = user?.avatarUrl || user?.avatar_url || null;

        // Upload and process (compress) the avatar
        const avatarUrl = await uploadAvatarToStorage(req.file.buffer, req.user.sub);

        // Update the user's avatar_url in the database.
        // If this fails, delete the newly uploaded file to avoid orphan objects.
        try {
            await updateUserAvatar(req.user.sub, avatarUrl);
        } catch (dbError) {
            try {
                await deleteAvatarFromStorage(avatarUrl);
            } catch (cleanupError) {
                console.error("Avatar rollback delete failed:", cleanupError);
            }
            throw dbError;
        }

        // Best-effort cleanup of previous avatar after successful DB update.
        if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
            try {
                await deleteAvatarFromStorage(previousAvatarUrl);
            } catch (cleanupError) {
                console.error("Old avatar cleanup failed:", cleanupError);
            }
        }

        return res.status(200).json({ 
            status: 'success', 
            avatarUrl 
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(500).json({ message: "failed to upload avatar", error: error.message });
    }
}

export async function deleteAvatar(req, res) {
    try {
        const user = await fetchUserProfileById(req.user.sub);
        const avatarUrl = user?.avatarUrl || user?.avatar_url || null;

        if (avatarUrl) {
            await deleteAvatarFromStorage(avatarUrl);
        }

        await updateUserAvatar(req.user.sub, null);

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Avatar delete error:', error);
        return res.status(500).json({ message: "failed to delete avatar", error: error.message });
    }
}

export async function updateProfile(req, res) {
    const { name, phone, address, dateOfBirth, parentContact, email } = req.body || {};
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
            email,
        });

        if (!user) {
            return res.status(404).json({ message: "student profile not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "failed to update profile", error: error.message });
    }
}
