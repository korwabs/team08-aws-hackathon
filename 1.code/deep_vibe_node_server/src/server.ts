import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import swaggerUi from "swagger-ui-express";
import multer from "multer";

import db from "./database";
import TranscribeService from "./transcribe-service";
import { specs, swagger2Specs } from "./swagger";
import { S3UploadService } from "./services/s3-upload.service";
import ChatSummaryService from "./services/chat-summary";
import { HtmlUploadService } from "./services/html-upload.service";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const transcribeService = new TranscribeService();
const s3UploadService = new S3UploadService();
const chatSummaryService = new ChatSummaryService();
const htmlUploadService = new HtmlUploadService();

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // 이미지 파일 또는 HTML 파일 허용
    if (s3UploadService.isImageFile(file.mimetype) || file.mimetype === 'text/html' || file.originalname.toLowerCase().endsWith('.html')) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일 또는 HTML 파일만 업로드 가능합니다."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// 실시간 전사 결과 콜백 설정
transcribeService.setSocketCallback((socketId: string, result: any) => {
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit("transcribe-result", result);

    // 최종 결과인 경우 채팅 메시지로 저장
    if (
      !result.isPartial &&
      (socket as any).roomId &&
      result.transcript.trim()
    ) {
      const userId = (socket as any).userId || "anonymous";
      console.log(`💾 Saving message: "${result.transcript}" from ${userId}`);

      db.execute(
        "INSERT INTO messages (room_id, user_id, message, message_type) VALUES (?, ?, ?, ?)",
        [(socket as any).roomId, userId, result.transcript, "transcribe"]
      )
        .then(([dbResult]: any) => {
          const messageData = {
            id: dbResult.insertId,
            room_id: (socket as any).roomId,
            user_id: userId,
            message: result.transcript,
            message_type: "transcribe",
            created_at: new Date().toISOString(),
          };
          io.to((socket as any).roomId).emit("new-message", messageData);
        })
        .catch((error) => console.error("Database error:", error));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// OpenAPI JSON 문서 엔드포인트
app.get("/api/docs/openapi.json", (req, res) => {
  res.json(specs);
});

// OpenAPI 2.0 (Swagger 2.0) JSON 문서 엔드포인트
app.get("/api/docs/swagger.json", (req, res) => {
  res.json(swagger2Specs);
});

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: 채팅방 목록 (메시지 수, 이미지 수, HTML 파일 수 포함)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Room'
 *                   - type: object
 *                     properties:
 *                       message_count:
 *                         type: number
 *                         description: 총 메시지 수
 *                       image_count:
 *                         type: number
 *                         description: 이미지 메시지 수
 *                       html_count:
 *                         type: number
 *                         description: HTML 파일 수
 */
// REST API 엔드포인트
app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        r.*,
        COALESCE(m.total_messages, 0) as message_count,
        COALESCE(m.image_count, 0) as image_count,
        COALESCE(h.html_count, 0) as html_count
      FROM chat_rooms r
      LEFT JOIN (
        SELECT 
          room_id,
          COUNT(*) as total_messages,
          SUM(CASE WHEN message_type = 'image' THEN 1 ELSE 0 END) as image_count
        FROM messages 
        GROUP BY room_id
      ) m ON r.id = m.room_id
      LEFT JOIN (
        SELECT 
          room_id,
          COUNT(*) as html_count
        FROM html_files 
        GROUP BY room_id
      ) h ON r.id = h.room_id
      ORDER BY r.created_at DESC
    `);
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
app.post("/api/rooms", async (req, res) => {
  const { name, participants = 1 } = req.body;
  const roomId = uuidv4();

  try {
    await db.execute("INSERT INTO chat_rooms (id, name, participants) VALUES (?, ?, ?)", [
      roomId,
      name,
      participants,
    ]);
    res.json({ id: roomId, name, participants });
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
 *         description: 채팅 메시지 목록과 이미지 URL 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 채팅방의 모든 이미지 URL 목록
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: 이미지 파일 업로드
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               roomId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 업로드된 이미지 URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 messageId:
 *                   type: number
 */
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 선택되지 않았습니다." });
    }

    const { roomId, userId } = req.body;
    if (!roomId || !userId) {
      return res.status(400).json({ error: "roomId와 userId가 필요합니다." });
    }

    const imageUrl = await s3UploadService.uploadImage(req.file);

    // 이미지 메시지를 데이터베이스에 저장
    const [result]: any = await db.execute(
      "INSERT INTO messages (room_id, user_id, message, message_type) VALUES (?, ?, ?, ?)",
      [roomId, userId, imageUrl, "image"]
    );

    const messageData = {
      id: result.insertId,
      room_id: roomId,
      user_id: userId,
      message: imageUrl,
      message_type: "image",
      created_at: new Date().toISOString(),
    };

    // 실시간으로 채팅방에 이미지 메시지 전송
    io.to(roomId).emit("new-message", messageData);

    res.json({ url: imageUrl, messageId: result.insertId });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/html:
 *   post:
 *     summary: HTML 파일 업로드
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               html:
 *                 type: string
 *                 format: binary
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: HTML 파일 업로드 성공
 */
app.post("/api/rooms/:roomId/html", upload.single("html"), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "HTML 파일이 선택되지 않았습니다." });
    }

    if (!userId) {
      return res.status(400).json({ error: "userId가 필요합니다." });
    }

    // HTML 파일만 허용
    if (!req.file.originalname.toLowerCase().endsWith('.html')) {
      return res.status(400).json({ error: "HTML 파일만 업로드 가능합니다." });
    }

    const result = await htmlUploadService.uploadHtml(roomId, req.file, userId);
    res.json(result);
  } catch (error: any) {
    console.error("HTML upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/html:
 *   get:
 *     summary: HTML 파일 목록 조회
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML 파일 목록
 */
app.get("/api/rooms/:roomId/html", async (req, res) => {
  try {
    const { roomId } = req.params;
    const htmlFiles = await htmlUploadService.getHtmlFiles(roomId);
    res.json(htmlFiles);
  } catch (error: any) {
    console.error("HTML files fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/rooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;

  try {
    const [rows]: any = await db.execute(
      "SELECT * FROM messages WHERE room_id = ? ORDER BY created_at ASC",
      [roomId]
    );

    const messages = rows.filter((row: any) => row.message_type !== "image");
    const imageUrls = rows
      .filter((row: any) => row.message_type === "image")
      .map((row: any) => row.message);

    res.json({
      messages: rows,
      imageUrls: imageUrls,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/summary:
 *   get:
 *     summary: 채팅방 대화 요약
 *     description: AWS Bedrock Claude Sonnet을 사용하여 채팅방의 대화 내용을 요약합니다
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅 요약 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *                   description: 대화 요약 내용
 *                 messageCount:
 *                   type: number
 *                   description: 텍스트 메시지 수
 *                 imageCount:
 *                   type: number
 *                   description: 이미지 메시지 수
 *       500:
 *         description: 서버 오류
 */
app.get("/api/rooms/:roomId/summary", async (req, res) => {
  const { roomId } = req.params;
  
  try {
    const summary = await chatSummaryService.summarizeChat(roomId);
    res.json(summary);
  } catch (error: any) {
    console.error("Chat summary error:", error);
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
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 채팅방 입장
  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    (socket as any).roomId = roomId;
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // 채팅 메시지
  socket.on(
    "chat-message",
    async (data: { roomId: string; userId: string; message: string }) => {
      const { roomId, userId, message } = data;

      try {
        const [result]: any = await db.execute(
          "INSERT INTO messages (room_id, user_id, message) VALUES (?, ?, ?)",
          [roomId, userId, message]
        );

        const messageData = {
          id: result.insertId,
          room_id: roomId,
          user_id: userId,
          message: message,
          message_type: "text",
          created_at: new Date().toISOString(),
        };

        io.to(roomId).emit("new-message", messageData);
      } catch (error) {
        console.error("Database error:", error);
      }
    }
  );

  // 음성 전사 시작
  socket.on("start-transcribe", async (data: { languageCode?: string }) => {
    try {
      const result = await transcribeService.startTranscription(
        socket.id,
        data.languageCode
      );
      socket.emit("transcribe-started", result);
    } catch (error: any) {
      socket.emit("transcribe-error", { error: error.message });
    }
  });

  // 음성 데이터 수신
  socket.on("audio-data", async (audioData: any) => {
    try {
      await transcribeService.processAudioChunk(socket.id, audioData);
    } catch (error) {
      console.error("Audio data processing error:", error);
      socket.emit("transcribe-error", { error: "Audio processing failed" });
    }
  });

  // 음성 전사 중지
  socket.on("stop-transcribe", async () => {
    try {
      const result = await transcribeService.stopTranscription(socket.id);
      socket.emit("transcribe-stopped", result);
    } catch (error: any) {
      socket.emit("transcribe-error", { error: error.message });
    }
  });

  // 사용자 정보 설정
  socket.on("set-user", (userId: string) => {
    (socket as any).userId = userId;
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    transcribeService.stopTranscription(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
