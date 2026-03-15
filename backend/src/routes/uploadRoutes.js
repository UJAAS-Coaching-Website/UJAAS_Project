import { Router } from 'express';
import multer from 'multer';
import { uploadImageToStorage, deleteImageFromStorage, uploadLandingPageImageToStorage, deleteLandingPageImageFromStorage } from '../services/storageService.js';
import { authenticate, requireAnyRole } from '../middleware/auth.js';

const router = Router();
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

// Store file in memory as a Buffer so we can pass it to S3 SDK directly
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF, SVG.'));
  }
});

// Protect the route so only admins and faculty can upload files
router.post('/', authenticate, requireAnyRole('admin', 'faculty'), (req, res) => {
  upload.single('image')(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'error', message: 'Image is too large. Maximum allowed size is 5MB.' });
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ status: 'error', message: 'Please upload exactly one image.' });
      }
      return res.status(400).json({ status: 'error', message: error.message || 'Upload failed.' });
    }

    if (error) {
      return res.status(400).json({ status: 'error', message: error.message || 'Upload failed.' });
    }

  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image file provided.' });
    }

    const { context, contextId, itemRole } = req.body;

    // Validate required metadata
    if (!context || !['tests', 'dpps', 'landing'].includes(context)) {
      return res.status(400).json({ status: 'error', message: "Invalid context. Must be 'tests', 'dpps' or 'landing'." });
    }

    if (context === 'landing') {
      if (!itemRole || !['faculty', 'achiever', 'vision'].includes(itemRole)) {
        return res.status(400).json({ status: 'error', message: "Invalid itemRole for landing. Must be 'faculty', 'achiever' or 'vision'." });
      }

      const imageUrl = await uploadLandingPageImageToStorage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        itemRole
      );
      
      return res.status(200).json({ status: 'success', imageUrl });
    }

    if (!contextId) {
      return res.status(400).json({ status: 'error', message: "Missing contextId for tests or dpps." });
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
});

// Delete an image from S3
router.delete('/', authenticate, requireAnyRole('admin', 'faculty'), async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ status: 'error', message: 'No imageUrl provided.' });
    }

    if (imageUrl.includes('landing-page')) {
      await deleteLandingPageImageFromStorage(imageUrl);
    } else {
      await deleteImageFromStorage(imageUrl);
    }

    res.status(200).json({ status: 'success', message: 'Image deleted successfully.' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to delete image.' });
  }
});

export default router;
