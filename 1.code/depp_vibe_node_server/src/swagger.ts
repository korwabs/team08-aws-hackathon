import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Real-time Chat & AWS Transcribe API',
      version: '1.0.0',
      description: 'WebSocket 기반 실시간 채팅과 AWS Transcribe 음성인식 API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            room_id: { type: 'string', format: 'uuid' },
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
