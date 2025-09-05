import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database';

interface HtmlUploadResult {
  id: number;
  filename: string;
  s3Url: string;
  version: number;
  fileSize: number;
}

interface HtmlFile {
  id: number;
  filename: string;
  s3_url: string;
  version: number;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export class HtmlUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'deep-vibe-uploads';
  }

  async getNextVersion(roomId: string): Promise<number> {
    const [rows] = await pool.execute(
      'SELECT MAX(version) as max_version FROM html_files WHERE room_id = ?',
      [roomId]
    );
    const result = rows as any[];
    return (result[0]?.max_version || 0) + 1;
  }

  async uploadHtml(
    roomId: string,
    file: Express.Multer.File,
    uploadedBy: string
  ): Promise<HtmlUploadResult> {
    const version = await this.getNextVersion(roomId);
    const fileExtension = '.html';
    const s3Key = `html/${roomId}/v${version}_${uuidv4()}${fileExtension}`;
    
    // S3에 파일 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: 'text/html',
      ACL: 'public-read'
    });

    await this.s3Client.send(uploadCommand);
    
    const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;

    // 데이터베이스에 파일 정보 저장
    const [result] = await pool.execute(
      `INSERT INTO html_files (room_id, filename, s3_key, s3_url, version, file_size, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [roomId, file.originalname, s3Key, s3Url, version, file.size, uploadedBy]
    );

    const insertResult = result as any;

    return {
      id: insertResult.insertId,
      filename: file.originalname,
      s3Url,
      version,
      fileSize: file.size
    };
  }

  async getHtmlFiles(roomId: string): Promise<HtmlFile[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM html_files WHERE room_id = ? ORDER BY version DESC',
      [roomId]
    );
    return rows as HtmlFile[];
  }
}
