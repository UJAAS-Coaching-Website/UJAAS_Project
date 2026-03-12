import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  forcePathStyle: true,
  region: 'ap-northeast-1',
  endpoint: 'https://zcgpdmavhhvtgzlgomoq.storage.supabase.co/storage/v1/s3',
  credentials: {
    accessKeyId: '1b21e916b2e5fe3d8e4357447f29f6a6',
    secretAccessKey: '346643e644142d5397c5fafe0d4376ced4c0969253eca649223905cf8133556d'
  }
});

async function testUpload() {
  const BUCKET_NAME = 'questions';
  const objectKey = 'test-upload.txt';
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: Buffer.from('Testing S3 Upload capability from backend.'),
    ContentType: 'text/plain'
  });

  try {
    console.log('Sending command to S3...');
    await s3Client.send(command);
    console.log('Successfully uploaded test file.');
  } catch (error) {
    console.error('Upload failed with error details:');
    console.error(error);
  }
}

testUpload();
