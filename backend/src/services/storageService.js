import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize the S3 Client for Supabase Storage
const s3Client = new S3Client({
  forcePathStyle: true,
  region: 'ap-northeast-1',
  endpoint: 'https://zcgpdmavhhvtgzlgomoq.supabase.co/storage/v1/s3',
  credentials: {
    accessKeyId: '1b21e916b2e5fe3d8e4357447f29f6a6',
    secretAccessKey: '346643e644142d5397c5fafe0d4376ced4c0969253eca649223905cf8133556d'
  }
});

const BUCKET_NAME = 'questions';

/**
 * Uploads a file buffer to the Supabase S3 bucket.
 * 
 * @param {Buffer} fileBuffer - The binary file buffer from multer.
 * @param {string} originalName - The original filename.
 * @param {string} mimeType - The file MIME type (e.g. image/jpeg).
 * @param {string} context - The context folder ('tests' or 'dpps').
 * @param {string} contextId - The ID of the test or DPP.
 * @param {string} itemRole - The role of the image ('question', 'option', 'explanation').
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export async function uploadImageToStorage(fileBuffer, originalName, mimeType, context, contextId, itemRole) {
  // Extract extension safely
  const extMatch = originalName.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1] : 'jpg';

  // Generate a random ID for collision resistance
  const randomId = crypto.randomUUID();
  
  // Construct the secure, flat-folder path (e.g., tests/123/question-abc.jpg)
  const objectKey = `${context}/${contextId}/${itemRole}-${randomId}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000'
  });

  try {
    await s3Client.send(command);
    
    // Construct the public URL manually since PutObject doesn't return it
    const publicUrl = `https://zcgpdmavhhvtgzlgomoq.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${objectKey}`;
    return publicUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload image to storage.');
  }
}
