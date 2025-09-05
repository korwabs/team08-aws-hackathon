import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-time Chat & AWS Transcribe API',
      version: '1.0.0',
      description: `
WebSocket 기반 실시간 채팅과 AWS Transcribe 음성인식 API

## WebSocket 연결
- **URL**: ws://localhost:3000 (개발) / wss://d2k05d66hwbq2e.cloudfront.net (프로덕션)
- **Protocol**: Socket.IO

## WebSocket 이벤트

### 클라이언트 → 서버
- **join-room**: 채팅방 입장 { roomId, userId }
- **chat-message**: 메시지 전송 { roomId, userId, message }
- **start-transcribe**: 음성인식 시작 { roomId, userId }
- **audio-data**: 오디오 데이터 전송 { audio: ArrayBuffer }
- **stop-transcribe**: 음성인식 중지

### 서버 → 클라이언트  
- **message-received**: 새 메시지 수신
- **transcription-result**: 음성인식 결과
- **user-joined**: 사용자 입장
- **user-left**: 사용자 퇴장
      `,
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://d2k05d66hwbq2e.cloudfront.net'
          : 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    components: {
      schemas: {
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            room_id: { type: 'string' },
            user_id: { type: 'string' },
            message: { type: 'string' },
            message_type: { type: 'string', enum: ['text', 'transcribe'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateRoom: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/server.ts'],
};

export const specs = swaggerJSDoc(options);
