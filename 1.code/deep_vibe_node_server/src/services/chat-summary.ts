import pool from '../database';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

interface ChatMessage {
  id: number;
  user_id: string;
  message: string;
  message_type: string;
  created_at: string;
}

interface ChatSummaryRequest {
  roomId: string;
}

interface ChatSummaryResponse {
  summary: string;
  messageCount: number;
  imageCount: number;
}

class ChatSummaryService {
  private bedrockClient: BedrockRuntimeClient;
  private s3Client: S3Client;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async getChatHistory(roomId: string): Promise<ChatMessage[]> {
    const [rows] = await pool.execute(
      'SELECT id, user_id, message, message_type, created_at FROM messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    );
    return rows as ChatMessage[];
  }

  async getImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      // S3 URL에서 버킷과 키 추출
      const url = new URL(imageUrl);
      const bucket = process.env.S3_BUCKET_NAME;
      const key = url.pathname.substring(1); // 앞의 '/' 제거

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];
      
      if (response.Body) {
        const stream = response.Body as any;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
      }

      const buffer = Buffer.concat(chunks);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  }

  async summarizeChat(roomId: string): Promise<ChatSummaryResponse> {
    const messages = await this.getChatHistory(roomId);
    
    if (messages.length === 0) {
      return {
        summary: '채팅 메시지가 없습니다.',
        messageCount: 0,
        imageCount: 0
      };
    }

    const textMessages = messages.filter(m => m.message_type === 'text');
    const imageMessages = messages.filter(m => m.message_type === 'image');
    
    // 텍스트 대화 내용
    const chatContent = textMessages
      .map(m => `[${m.created_at}] ${m.user_id}: ${m.message}`)
      .join('\n');

    // Claude에 전달할 메시지 구성
    const messageContent: any[] = [{
      type: 'text',
      text: `다음은 웹페이지 제작을 위한 채팅 대화 내용입니다. 대화에서 나온 모든 요구사항들을 상세히 정리해주세요.

**분석 목적**: 웹페이지 제작 에이전트에게 전달할 요구사항 정리
**응답 형식**: 
1. 주요 요구사항 (기능, 디자인, 기술스택 등)
2. 세부 사항 및 제약조건
3. 우선순위 및 중요도
4. 이미지 관련 요구사항 (업로드된 이미지가 있다면)

**채팅 대화 내용**:
${chatContent}`
    }];

    // 이미지 메시지들을 base64로 변환하여 추가
    for (const imageMsg of imageMessages) {
      const base64Image = await this.getImageAsBase64(imageMsg.message);
      if (base64Image) {
        messageContent.push({
          type: 'text',
          text: `\n[${imageMsg.created_at}] ${imageMsg.user_id}가 업로드한 이미지:`
        });
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Image
          }
        });
      }
    }

    const input = {
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: messageContent
        }]
      })
    };

    const command = new InvokeModelCommand(input);
    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      summary: responseBody.content[0].text,
      messageCount: textMessages.length,
      imageCount: imageMessages.length
    };
  }
}

export default ChatSummaryService;
