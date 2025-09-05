import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import swaggerUi from 'swagger-ui-express';

import db from './database';
import TranscribeService from './transcribe-service';
import { specs } from './swagger';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const transcribeService = new TranscribeService();

// 실시간 전사 결과 콜백 설정
transcribeService.setSocketCallback((socketId: string, result: any) => {
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('transcribe-result', result);
    
    // 최종 결과인 경우 채팅 메시지로 저장
    if (!result.isPartial && (socket as any).roomId && result.transcript.trim()) {
      const userId = (socket as any).userId || 'anonymous';
      console.log(`💾 Saving message: "${result.transcript}" from ${userId}`);
      
      db.execute('INSERT INTO messages (room_id, user_id, message, message_type) VALUES (?, ?, ?, ?)', 
        [(socket as any).roomId, userId, result.transcript, 'transcribe'])
        .then(([dbResult]: any) => {
          const messageData = {
            id: dbResult.insertId,
            room_id: (socket as any).roomId,
            user_id: userId,
            message: result.transcript,
            message_type: 'transcribe',
            created_at: new Date().toISOString()
          };
          io.to((socket as any).roomId).emit('new-message', messageData);
        })
        .catch(error => console.error('Database error:', error));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: 채팅방 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
// REST API 엔드포인트
app.get('/api/rooms', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM chat_rooms ORDER BY created_at DESC');
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: 채팅방 생성
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoom'
 *     responses:
 *       200:
 *         description: 생성된 채팅방 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 */
app.post('/api/rooms', async (req, res) => {
  const { name } = req.body;
  const roomId = uuidv4();
  
  try {
    await db.execute('INSERT INTO chat_rooms (id, name) VALUES (?, ?)', [roomId, name]);
    res.json({ id: roomId, name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: 채팅방 메시지 조회
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅 메시지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
app.get('/api/rooms/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const [rows] = await db.execute('SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC', [roomId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketEvents:
 *       type: object
 *       description: WebSocket 이벤트 목록
 *       properties:
 *         join-room:
 *           type: string
 *           description: 채팅방 입장 (roomId 전송)
 *         chat-message:
 *           type: object
 *           properties:
 *             roomId: { type: string }
 *             userId: { type: string }
 *             message: { type: string }
 *         start-transcribe:
 *           type: object
 *           properties:
 *             languageCode: { type: string, default: 'ko-KR' }
 *         audio-data:
 *           type: string
 *           description: 오디오 데이터 (Binary)
 *         stop-transcribe:
 *           type: string
 *           description: 음성인식 중지
 *         set-user:
 *           type: string
 *           description: 사용자 ID 설정
 */

// WebSocket 연결 처리
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 채팅방 입장
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    (socket as any).roomId = roomId;
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // 채팅 메시지
  socket.on('chat-message', async (data: { roomId: string; userId: string; message: string }) => {
    const { roomId, userId, message } = data;
    
    try {
      const [result]: any = await db.execute('INSERT INTO messages (room_id, user_id, message) VALUES (?, ?, ?)', 
        [roomId, userId, message]);
      
      const messageData = {
        id: result.insertId,
        room_id: roomId,
        user_id: userId,
        message: message,
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      io.to(roomId).emit('new-message', messageData);
    } catch (error) {
      console.error('Database error:', error);
    }
  });

  // 음성 전사 시작
  socket.on('start-transcribe', async (data: { languageCode?: string }) => {
    try {
      const result = await transcribeService.startTranscription(socket.id, data.languageCode);
      socket.emit('transcribe-started', result);
    } catch (error: any) {
      socket.emit('transcribe-error', { error: error.message });
    }
  });

  // 음성 데이터 수신
  socket.on('audio-data', async (audioData: any) => {
    try {
      await transcribeService.processAudioChunk(socket.id, audioData);
    } catch (error) {
      console.error('Audio data processing error:', error);
      socket.emit('transcribe-error', { error: 'Audio processing failed' });
    }
  });

  // 음성 전사 중지
  socket.on('stop-transcribe', async () => {
    try {
      const result = await transcribeService.stopTranscription(socket.id);
      socket.emit('transcribe-stopped', result);
    } catch (error: any) {
      socket.emit('transcribe-error', { error: error.message });
    }
  });

  // 사용자 정보 설정
  socket.on('set-user', (userId: string) => {
    (socket as any).userId = userId;
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    transcribeService.stopTranscription(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
