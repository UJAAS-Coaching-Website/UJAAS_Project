import { Router } from 'express';
import multer from 'multer';
import { uploadImageToStorage } from '../services/storageService.js';
import { authenticate, requireAnyRole } from '../middleware/auth.js';

const router = Router();

// Store file in memory as a Buffer so we can pass it to S3 SDK directly
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Protect the route so only admins and faculty can upload files
router.post('/', authenticate, requireAnyRole('admin', 'faculty'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file provided.' });
    }

    const { context, contextId, itemRole } = req.body;

    // Validate required metadata
    if (!context || !['tests', 'dpps'].includes(context)) {
      return res.status(400).json({ status: 'error', message: "Invalid context. Must be 'tests' or 'dpps'." });
    }
    if (!contextId) {
      return res.status(400).json({ status: 'error', message: "Missing contextId." });
    }
    if (!itemRole || !['question', 'option', 'explanation'].includes(itemRole)) {
      return res.status(400).json({ status: 'error', message: "Invalid itemRole. Must be 'question', 'option', or 'explanation'." });
    }

    // Pass the memory buffer to the S3 service
    const imageUrl = await uploadImageToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      context,
      contextId,
      itemRole
    );

    res.status(200).json({ 
      status: 'success', 
      imageUrl 
    });
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error during upload.' });
  }
});

export default router;
