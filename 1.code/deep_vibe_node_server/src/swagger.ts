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
            participants: { type: 'integer' },
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
            name: { type: 'string' },
            participants: { type: 'integer', default: 1, minimum: 1 }
          }
        }
      }
    }
  },
  apis: ['./src/server.ts'],
};

// OpenAPI 2.0 (Swagger 2.0) 스펙 생성
const swagger2Options = {
  swaggerDefinition: {
    swagger: '2.0',
    info: {
      title: 'Real-time Chat & AWS Transcribe API',
      version: '1.0.0',
      description: 'WebSocket 기반 실시간 채팅과 AWS Transcribe 음성인식 API'
    },
    host: process.env.NODE_ENV === 'production' 
      ? 'd2k05d66hwbq2e.cloudfront.net'
      : 'localhost:3000',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
    basePath: '/',
    produces: ['application/json'],
    consumes: ['application/json', 'multipart/form-data'],
    definitions: {
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          participants: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          message_count: { type: 'integer' },
          image_count: { type: 'integer' }
        }
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          room_id: { type: 'string' },
          user_id: { type: 'string' },
          message: { type: 'string' },
          message_type: { type: 'string', enum: ['text', 'transcribe', 'image'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      HtmlFile: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          filename: { type: 'string' },
          s3_url: { type: 'string' },
          version: { type: 'integer' },
          file_size: { type: 'integer' },
          uploaded_by: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ChatSummary: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          messageCount: { type: 'integer' },
          imageCount: { type: 'integer' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    },
    paths: {
      '/api/rooms': {
        get: {
          summary: '채팅방 목록 조회',
          responses: {
            200: {
              description: '채팅방 목록',
              schema: {
                type: 'array',
                items: { $ref: '#/definitions/Room' }
              }
            }
          }
        },
        post: {
          summary: '채팅방 생성',
          parameters: [{
            name: 'body',
            in: 'body',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                participants: { type: 'integer', default: 1, minimum: 1 }
              }
            }
          }],
          responses: {
            201: {
              description: '채팅방 생성 성공',
              schema: { $ref: '#/definitions/Room' }
            }
          }
        }
      },
      '/api/rooms/{roomId}/messages': {
        get: {
          summary: '채팅방 메시지 조회',
          parameters: [{
            name: 'roomId',
            in: 'path',
            required: true,
            type: 'string'
          }],
          responses: {
            200: {
              description: '메시지 목록',
              schema: {
                type: 'array',
                items: { $ref: '#/definitions/Message' }
              }
            }
          }
        }
      },
      '/api/rooms/{roomId}/summary': {
        get: {
          summary: '채팅방 대화 요약',
          parameters: [{
            name: 'roomId',
            in: 'path',
            required: true,
            type: 'string'
          }],
          responses: {
            200: {
              description: '대화 요약',
              schema: { $ref: '#/definitions/ChatSummary' }
            }
          }
        }
      },
      '/api/rooms/{roomId}/html': {
        get: {
          summary: 'HTML 파일 목록 조회',
          parameters: [{
            name: 'roomId',
            in: 'path',
            required: true,
            type: 'string'
          }],
          responses: {
            200: {
              description: 'HTML 파일 목록',
              schema: {
                type: 'array',
                items: { $ref: '#/definitions/HtmlFile' }
              }
            }
          }
        },
        post: {
          summary: 'HTML 파일 업로드',
          consumes: ['multipart/form-data'],
          parameters: [
            {
              name: 'roomId',
              in: 'path',
              required: true,
              type: 'string'
            },
            {
              name: 'html',
              in: 'formData',
              required: true,
              type: 'file'
            },
            {
              name: 'userId',
              in: 'formData',
              required: true,
              type: 'string'
            }
          ],
          responses: {
            200: {
              description: 'HTML 파일 업로드 성공',
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  filename: { type: 'string' },
                  s3Url: { type: 'string' },
                  version: { type: 'integer' },
                  fileSize: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

export const specs = swaggerJSDoc(options);
export const swagger2Specs = swaggerJSDoc(swagger2Options);
