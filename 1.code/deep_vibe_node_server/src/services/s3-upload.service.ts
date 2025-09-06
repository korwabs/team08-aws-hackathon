import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'deep-vibe-uploads';
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `images/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
  }

  async uploadTextFile(content: string, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}
