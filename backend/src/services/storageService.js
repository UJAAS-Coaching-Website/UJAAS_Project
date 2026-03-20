import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
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

const STORAGE_PUBLIC_BASE_URL = 'https://zcgpdmavhhvtgzlgomoq.supabase.co/storage/v1/object/public';
const QUESTIONS_BUCKET_NAME = 'questions';
const NOTES_BUCKET_NAME = 'notes';
const QUESTION_BANK_BUCKET_NAME = 'question-bank';
const LANDING_PAGE_BUCKET_NAME = 'landing-page';
const TIMETABLES_BUCKET_NAME = 'timetables';
const AVATARS_BUCKET_NAME = 'avatar';

const buildPublicUrl = (bucketName, objectKey) =>
  `${STORAGE_PUBLIC_BASE_URL}/${bucketName}/${objectKey}`;

import sharp from 'sharp';

/**
 * Uploads a profile picture to the Supabase S3 bucket.
 * Resizes and compresses the image using sharp.
 * 
 * @param {Buffer} fileBuffer - The binary file buffer from multer.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string>} The public URL of the uploaded avatar.
 */
export async function uploadAvatarToStorage(fileBuffer, userId) {
  try {
    // Process image with sharp: resize to 400x400 max, convert to WebP with 80% quality
    // This should easily stay under 50kb for an avatar
    const processedBuffer = await sharp(fileBuffer)
      .resize(400, 400, {
        fit: 'cover',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    const objectKey = `${userId}/avatar-${Date.now()}.webp`;

    return await uploadBufferToBucket(AVATARS_BUCKET_NAME, objectKey, processedBuffer, 'image/webp');
  } catch (error) {
    console.error('Avatar storage upload error:', error);
    throw new Error('Failed to process and upload avatar.');
  }
}

const sanitizeFileName = (originalName) => {
  const extMatch = originalName.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
  const baseName = originalName.replace(/\.[^.]+$/, '');
  const sanitizedBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';

  return `${sanitizedBase}.${ext}`;
};

const buildSanitizedFileNameWithSourceExtension = (desiredName, sourceName) => {
  const extMatch = sourceName.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
  const sanitizedBase = String(desiredName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'file';

  return `${sanitizedBase}.${ext}`;
};

const sanitizePathSegment = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general';

async function uploadBufferToBucket(bucketName, objectKey, fileBuffer, mimeType) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000'
  });

  await s3Client.send(command);
  return buildPublicUrl(bucketName, objectKey);
}

async function deleteFileFromStorageByUrl(fileUrl, bucketName) {
  const urlPrefix = `${STORAGE_PUBLIC_BASE_URL}/${bucketName}/`;

  if (!fileUrl?.startsWith(urlPrefix)) {
    console.warn('Storage URL does not match expected pattern, skipping delete:', fileUrl);
    return;
  }

  let objectKey = fileUrl.slice(urlPrefix.length);
  if (objectKey.startsWith(`${bucketName}/`)) {
    objectKey = objectKey.slice(bucketName.length + 1);
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    const isMissingObject =
      error?.Code === 'NoSuchKey' ||
      error?.name === 'NoSuchKey' ||
      error?.$metadata?.httpStatusCode === 404;

    if (isMissingObject) {
      console.warn('Storage object not found, skipping delete:', { bucketName, objectKey });
      return;
    }

    throw error;
  }
}

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

  try {
    return await uploadBufferToBucket(QUESTIONS_BUCKET_NAME, objectKey, fileBuffer, mimeType);
  } catch (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload image to storage.');
  }
}

export async function uploadLandingPageImageToStorage(fileBuffer, originalName, mimeType, itemRole) {
  const extMatch = originalName.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1] : 'jpg';

  const randomId = crypto.randomUUID();
  const objectKey = `${itemRole}/${randomId}.${ext}`;

  try {
    return await uploadBufferToBucket(LANDING_PAGE_BUCKET_NAME, objectKey, fileBuffer, mimeType);
  } catch (error) {
    console.error('Landing page storage upload error:', error);
    throw new Error('Failed to upload landing page image to storage.');
  }
}

export async function uploadNoteToStorage(fileBuffer, originalName, mimeType, chapterContext, noteId) {
  const sanitizedFileName = sanitizeFileName(originalName);
  const objectKey = [
    'batches',
    chapterContext.batch_id,
    'chapters',
    chapterContext.id,
    'notes',
    noteId,
    sanitizedFileName,
  ].join('/');

  try {
    return await uploadBufferToBucket(NOTES_BUCKET_NAME, objectKey, fileBuffer, mimeType);
  } catch (error) {
    console.error('Notes storage upload error:', error);
    throw new Error('Failed to upload note to storage.');
  }
}

export async function uploadQuestionBankFileToStorage(fileBuffer, originalName, mimeType, subjectName, fileId, title) {
  const sanitizedFileName = buildSanitizedFileNameWithSourceExtension(title, originalName);
  const objectKey = [
    'subjects',
    sanitizePathSegment(subjectName),
    'files',
    fileId,
    sanitizedFileName,
  ].join('/');

  try {
    return await uploadBufferToBucket(QUESTION_BANK_BUCKET_NAME, objectKey, fileBuffer, mimeType);
  } catch (error) {
    console.error('Question bank storage upload error:', error);
    throw new Error('Failed to upload question bank file to storage.');
  }
}

export async function uploadTimetableToStorage(fileBuffer, originalName, mimeType, batchId) {
  const sanitizedFileName = sanitizeFileName(originalName);
  const objectKey = ['batches', sanitizePathSegment(batchId), sanitizedFileName].join('/');

  try {
    return await uploadBufferToBucket(TIMETABLES_BUCKET_NAME, objectKey, fileBuffer, mimeType);
  } catch (error) {
    console.error('Timetable storage upload error:', error);
    throw new Error('Failed to upload timetable to storage.');
  }
}

/**
 * Deletes an image from the Supabase S3 bucket using its public URL.
 * 
 * @param {string} imageUrl - The full public URL of the image to delete.
 */
export async function deleteImageFromStorage(imageUrl) {
  try {
    await deleteFileFromStorageByUrl(imageUrl, QUESTIONS_BUCKET_NAME);
  } catch (error) {
    console.error('Storage delete error:', error);
    throw new Error('Failed to delete image from storage.');
  }
}

export async function deleteAvatarFromStorage(imageUrl) {
  try {
    await deleteFileFromStorageByUrl(imageUrl, AVATARS_BUCKET_NAME);
  } catch (error) {
    console.error('Avatar storage delete error:', error);
    throw new Error('Failed to delete avatar from storage.');
  }
}

export async function deleteLandingPageImageFromStorage(imageUrl) {
  try {
    await deleteFileFromStorageByUrl(imageUrl, LANDING_PAGE_BUCKET_NAME);
  } catch (error) {
    console.error('Landing page storage delete error:', error);
    throw new Error('Failed to delete landing page image from storage.');
  }
}

export async function deleteNoteFromStorage(fileUrl) {
  try {
    await deleteFileFromStorageByUrl(fileUrl, NOTES_BUCKET_NAME);
  } catch (error) {
    console.error('Notes storage delete error:', error);
    throw new Error('Failed to delete note from storage.');
  }
}

export async function deleteQuestionBankFileFromStorage(fileUrl) {
  try {
    await deleteFileFromStorageByUrl(fileUrl, QUESTION_BANK_BUCKET_NAME);
  } catch (error) {
    console.error('Question bank storage delete error:', error);
    throw new Error('Failed to delete question bank file from storage.');
  }
}

export async function deleteTimetableFromStorage(fileUrl) {
  try {
    await deleteFileFromStorageByUrl(fileUrl, TIMETABLES_BUCKET_NAME);
  } catch (error) {
    console.error('Timetable storage delete error:', error);
    throw new Error('Failed to delete timetable from storage.');
  }
}

/**
 * Deletes ALL images under a context folder (e.g., tests/123/) from S3.
 * Used for cascade cleanup when an entire test or DPP is deleted.
 * 
 * @param {string} context - 'tests' or 'dpps'
 * @param {string} contextId - The ID of the test or DPP
 */
export async function deleteAllImagesForContext(context, contextId) {
  try {
    const prefix = `${context}/${contextId}/`;

    // List all objects under this prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: QUESTIONS_BUCKET_NAME,
      Prefix: prefix
    });

    const listResult = await s3Client.send(listCommand);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      console.log(`No S3 objects found under prefix: ${prefix}`);
      return;
    }

    // Batch delete all objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: QUESTIONS_BUCKET_NAME,
      Delete: {
        Objects: listResult.Contents.map(obj => ({ Key: obj.Key })),
        Quiet: true
      }
    });

    await s3Client.send(deleteCommand);
    console.log(`Deleted ${listResult.Contents.length} S3 objects under: ${prefix}`);
  } catch (error) {
    console.error('Bulk S3 delete error:', error);
    // Don't throw — we don't want S3 cleanup failure to block test deletion
  }
}
