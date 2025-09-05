import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

interface AudioSegment {
  transcript: string;
  start_time: string;
  end_time: string;
}

class FileTranscribeService {
  private transcribeClient: TranscribeClient;
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.transcribeClient = new TranscribeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "deep-vibe-audio-files";
  }

  async transcribeAudioFile(audioBuffer: Buffer, fileName: string): Promise<AudioSegment[]> {
    const s3Key = `audio/${fileName}`;
    
    // S3에 오디오 파일 업로드
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: "audio/wav"
    }));

    // Transcribe 작업 시작
    const jobName = `transcribe-${Date.now()}`;
    const mediaUri = `s3://${this.bucketName}/${s3Key}`;

    await this.transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      Media: { MediaFileUri: mediaUri },
      MediaFormat: "wav",
      LanguageCode: "ko-KR"
    }));

    // 작업 완료 대기
    return await this.waitForTranscription(jobName);
  }

  private async waitForTranscription(jobName: string): Promise<AudioSegment[]> {
    while (true) {
      const result = await this.transcribeClient.send(new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      }));

      if (result.TranscriptionJob?.TranscriptionJobStatus === "COMPLETED") {
        const transcriptUri = result.TranscriptionJob.Transcript?.TranscriptFileUri;
        if (transcriptUri) {
          const response = await fetch(transcriptUri);
          const data: any = await response.json();
          console.log(`📋 [transcribe-response] Full response:`, JSON.stringify(data, null, 2));
          
          // audio_segments를 시간 정보와 함께 반환
          const audioSegments = data.results?.audio_segments || [];
          return audioSegments
            .filter((segment: any) => segment.transcript?.trim())
            .map((segment: any) => ({
              transcript: segment.transcript,
              start_time: segment.start_time,
              end_time: segment.end_time
            }));
        }
      } else if (result.TranscriptionJob?.TranscriptionJobStatus === "FAILED") {
        throw new Error("Transcription failed");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

export default FileTranscribeService;
