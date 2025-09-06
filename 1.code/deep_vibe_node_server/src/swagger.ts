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
- **start-transcribe**: 실시간 음성인식 시작 { roomId, userId }
- **audio-data**: 실시간 오디오 데이터 전송 { audio: ArrayBuffer }
- **stop-transcribe**: 실시간 음성인식 중지
- **start-file-recording**: 파일 기반 녹음 시작
- **audio-chunk**: 파일 기반 오디오 청크 전송 { chunk: ArrayBuffer }
- **stop-file-recording**: 파일 기반 녹음 중지 및 STT 처리
- **generate-html-demo**: HTML 데모 생성 요청 { roomId, userId, imageUrl?, prdUrl?, htmlUrl? }

### 서버 → 클라이언트  
- **message-received**: 새 메시지 수신
- **transcription-result**: 실시간 음성인식 결과
- **chat-message**: 채팅 메시지 브로드캐스트
- **file-transcribe-complete**: 파일 STT 처리 완료
- **file-transcribe-error**: 파일 STT 처리 오류
- **user-joined**: 사용자 입장
- **user-left**: 사용자 퇴장
- **html-demo-progress**: HTML 데모 생성 진행 상황 { step, message }
- **html-demo-complete**: HTML 데모 생성 완료 { success, message, prdFile, htmlFile }
- **html-demo-error**: HTML 데모 생성 오류 { success, error }

## 성능 최적화
- **실시간 STT**: 1024 샘플(64ms) 청크로 지연시간 최소화
- **파일 STT**: S3 업로드 후 Amazon Transcribe 배치 처리
- **PCM 검증**: 단일 채널 PCM 데이터 무결성 확인
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
        },
        HtmlDemoRequest: {
          type: 'object',
          properties: {
            roomId: { type: 'string' },
            userId: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            prdUrl: { type: 'string', nullable: true },
            htmlUrl: { type: 'string', nullable: true }
          },
          required: ['roomId', 'userId']
        },
        HtmlDemoProgress: {
          type: 'object',
          properties: {
            step: { type: 'string', enum: ['summary', 'fastapi', 'upload'] },
            message: { type: 'string' }
          }
        },
        HtmlDemoComplete: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            prdFile: { type: 'string' },
            htmlFile: { type: 'string' }
          }
        },
        HtmlDemoError: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        },
        WebSocketEvents: {
          type: 'object',
          description: 'WebSocket 이벤트 목록',
          properties: {
            'join-room': {
              type: 'string',
              description: '채팅방 입장 (roomId 전송)'
            },
            'chat-message': {
              type: 'object',
              properties: {
                roomId: { type: 'string' },
                userId: { type: 'string' },
                message: { type: 'string' }
              }
            },
            'start-transcribe': {
              type: 'object',
              properties: {
                languageCode: { type: 'string', default: 'ko-KR' }
              }
            },
            'audio-data': {
              type: 'string',
              description: '오디오 데이터 (Binary)'
            },
            'stop-transcribe': {
              type: 'string',
              description: '음성인식 중지'
            },
            'set-user': {
              type: 'string',
              description: '사용자 ID 설정'
            },
            'generate-html-demo': {
              $ref: '#/components/schemas/HtmlDemoRequest'
            }
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
          image_count: { type: 'integer' },
          html_count: { type: 'integer' }
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
