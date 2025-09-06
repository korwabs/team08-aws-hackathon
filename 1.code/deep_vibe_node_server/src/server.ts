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
import FileTranscribeService from "./file-transcribe-service";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const transcribeService = new TranscribeService();
const fileTranscribeService = new FileTranscribeService();
const s3UploadService = new S3UploadService();
const chatSummaryService = new ChatSummaryService();
const htmlUploadService = new HtmlUploadService();

// Multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (s3UploadService.isImageFile(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// HTML 파일 전용 Multer 설정
const htmlUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/html" ||
      file.originalname.toLowerCase().endsWith(".html")
    ) {
      cb(null, true);
    } else {
      cb(new Error("HTML 파일만 업로드 가능합니다."));
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
    console.log(`🎯 [transcribe-callback] Result for ${socketId}:`, {
      transcript:
        result.transcript?.substring(0, 50) +
        (result.transcript?.length > 50 ? "..." : ""),
      isPartial: result.isPartial,
      confidence: result.confidence,
      roomId: (socket as any).roomId,
    });

    socket.emit("transcribe-result", result);

    // 최종 결과인 경우 채팅 메시지로 저장
    if (
      !result.isPartial &&
      (socket as any).roomId &&
      result.transcript.trim()
    ) {
      const userId = (socket as any).userId || "anonymous";
      const roomId = (socket as any).roomId;

      console.log(
        `💾 [transcribe-callback] Saving final transcript as message:`,
        {
          socketId,
          userId,
          roomId,
          transcript: result.transcript,
          transcriptLength: result.transcript.length,
        }
      );

      db.execute(
        "INSERT INTO messages (room_id, user_id, message, message_type) VALUES (?, ?, ?, ?)",
        [roomId, userId, result.transcript, "transcribe"]
      )
        .then(([dbResult]: any) => {
          const messageData = {
            id: dbResult.insertId,
            room_id: roomId,
            user_id: userId,
            message: result.transcript,
            message_type: "transcribe",
            created_at: new Date().toISOString(),
          };

          console.log(
            `📤 [transcribe-callback] Broadcasting transcribed message to room ${roomId}:`,
            {
              messageId: dbResult.insertId,
              userId,
              transcript:
                result.transcript.substring(0, 50) +
                (result.transcript.length > 50 ? "..." : ""),
            }
          );

          io.to(roomId).emit("new-message", messageData);
          console.log(
            `✅ [transcribe-callback] Transcribed message saved and broadcasted successfully`
          );
        })
        .catch((error) => {
          console.error(
            `❌ [transcribe-callback] Error saving transcribed message:`,
            error
          );
        });
    }
  } else {
    console.warn(
      `⚠️ [transcribe-callback] Socket ${socketId} not found for transcribe result`
    );
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
        COALESCE(h.html_count, 0) as html_count,
        COALESCE(p.prd_count, 0) as prd_count
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
      LEFT JOIN (
        SELECT 
          room_id,
          COUNT(*) as prd_count
        FROM prd_files 
        GROUP BY room_id
      ) p ON r.id = p.room_id
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
    await db.execute(
      "INSERT INTO chat_rooms (id, name, participants) VALUES (?, ?, ?)",
      [roomId, name, participants]
    );
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
app.post(
  "/api/rooms/:roomId/html",
  htmlUpload.single("html"),
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "HTML 파일이 선택되지 않았습니다." });
      }

      if (!userId) {
        return res.status(400).json({ error: "userId가 필요합니다." });
      }

      // HTML 파일만 허용
      if (!req.file.originalname.toLowerCase().endsWith(".html")) {
        return res
          .status(400)
          .json({ error: "HTML 파일만 업로드 가능합니다." });
      }

      const result = await htmlUploadService.uploadHtml(
        roomId,
        req.file,
        userId
      );
      res.json(result);
    } catch (error: any) {
      console.error("HTML upload error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

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

/**
 * @swagger
 * /api/rooms/{roomId}/prd:
 *   post:
 *     summary: PRD 파일 업로드
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               prd:
 *                 type: string
 *                 format: binary
 *               uploadedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: PRD 파일 업로드 성공
 */
app.post("/api/rooms/:roomId/prd", multer().single("prd"), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { uploadedBy } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "PRD 파일이 필요합니다." });
    }

    if (!file.originalname.endsWith('.md')) {
      return res.status(400).json({ error: "MD 파일만 업로드 가능합니다." });
    }

    const content = file.buffer.toString('utf-8');

    await db.execute(
      "INSERT INTO prd_files (room_id, filename, content, uploaded_by) VALUES (?, ?, ?, ?)",
      [roomId, file.originalname, content, uploadedBy || 'anonymous']
    );

    res.json({ message: "PRD 파일이 성공적으로 업로드되었습니다." });
  } catch (error: any) {
    console.error("PRD upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/prd:
 *   get:
 *     summary: PRD 파일 목록 조회
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PRD 파일 목록
 */
app.get("/api/rooms/:roomId/prd", async (req, res) => {
  try {
    const { roomId } = req.params;
    const [rows] = await db.execute(
      "SELECT id, filename, uploaded_by, created_at FROM prd_files WHERE room_id = ? ORDER BY created_at DESC",
      [roomId]
    );
    res.json(rows);
  } catch (error: any) {
    console.error("PRD files fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/rooms/{roomId}/prd/{prdId}:
 *   get:
 *     summary: PRD 파일 내용 조회
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: prdId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PRD 파일 내용
 */
app.get("/api/rooms/:roomId/prd/:prdId", async (req, res) => {
  try {
    const { roomId, prdId } = req.params;
    const [rows]: any = await db.execute(
      "SELECT * FROM prd_files WHERE room_id = ? AND id = ?",
      [roomId, prdId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "PRD 파일을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error("PRD file fetch error:", error);
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
  console.log(
    `🔌 [WebSocket] New connection: ${socket.id} from ${socket.handshake.address}`
  );

  // 채팅방 입장
  socket.on("join-room", (roomId: string) => {
    console.log(`🏠 [join-room] Socket ${socket.id} joining room: ${roomId}`);

    // 이전 방에서 나가기
    if ((socket as any).roomId) {
      const prevRoom = (socket as any).roomId;
      socket.leave(prevRoom);
      console.log(
        `🚪 [join-room] Socket ${socket.id} left previous room: ${prevRoom}`
      );
    }

    socket.join(roomId);
    (socket as any).roomId = roomId;
    console.log(
      `✅ [join-room] Socket ${socket.id} successfully joined room: ${roomId}`
    );
    console.log(
      `👥 [join-room] Room ${roomId} now has ${
        io.sockets.adapter.rooms.get(roomId)?.size || 0
      } members`
    );
  });

  // 채팅 메시지
  socket.on(
    "chat-message",
    async (data: { roomId: string; userId: string; message: string }) => {
      const { roomId, userId, message } = data;

      console.log(`💬 [chat-message] Received from ${socket.id}:`, {
        roomId,
        userId,
        message:
          message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        messageLength: message.length,
      });

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

        console.log(
          `📤 [chat-message] Broadcasting to room ${roomId}, message ID: ${result.insertId}`
        );
        io.to(roomId).emit("new-message", messageData);
        console.log(
          `✅ [chat-message] Message saved and broadcasted successfully`
        );
      } catch (error) {
        console.error(
          `❌ [chat-message] Database error for ${socket.id}:`,
          error
        );
      }
    }
  );

  // 음성 전사 시작
  socket.on("start-transcribe", async (data: { languageCode?: string }) => {
    const roomId = (socket as any).roomId;
    const userId = (socket as any).userId || "anonymous";

    console.log(`🎤 [start-transcribe] Request from ${socket.id}:`, {
      roomId,
      userId,
      languageCode: data.languageCode || "ko-KR",
    });

    if (!roomId) {
      console.warn(`⚠️ [start-transcribe] Socket ${socket.id} not in any room`);
      socket.emit("transcribe-error", { error: "방에 입장해주세요" });
      return;
    }

    try {
      const result = await transcribeService.startTranscription(
        socket.id,
        data.languageCode
      );
      console.log(
        `✅ [start-transcribe] Transcription started for ${socket.id}:`,
        result
      );
      socket.emit("transcribe-started", result);
    } catch (error: any) {
      console.error(`❌ [start-transcribe] Error for ${socket.id}:`, error);
      socket.emit("transcribe-error", { error: error.message });
    }
  });

  // 음성 데이터 수신
  socket.on("audio-data", async (audioData: any) => {
    const roomId = (socket as any).roomId;
    const dataSize = audioData.byteLength || audioData.length || 0;

    // 너무 많은 로그를 방지하기 위해 10초마다 한 번씩만 로그
    if (
      !(socket as any).lastAudioLogTime ||
      Date.now() - (socket as any).lastAudioLogTime > 10000
    ) {
      console.log(
        `🔊 [audio-data] Receiving from ${socket.id}: ${dataSize} bytes/chunk (room: ${roomId})`
      );
      (socket as any).lastAudioLogTime = Date.now();
    }

    try {
      await transcribeService.processAudioChunk(socket.id, audioData);
    } catch (error) {
      console.error(
        `❌ [audio-data] Processing error for ${socket.id}:`,
        error
      );
      socket.emit("transcribe-error", { error: "Audio processing failed" });
    }
  });

  // 음성 전사 중지
  socket.on("stop-transcribe", async () => {
    const roomId = (socket as any).roomId;
    const userId = (socket as any).userId || "anonymous";

    console.log(`🛑 [stop-transcribe] Request from ${socket.id}:`, {
      roomId,
      userId,
    });

    try {
      const result = await transcribeService.stopTranscription(socket.id);
      console.log(
        `✅ [stop-transcribe] Transcription stopped for ${socket.id}:`,
        result
      );
      socket.emit("transcribe-stopped", result);
    } catch (error: any) {
      console.error(`❌ [stop-transcribe] Error for ${socket.id}:`, error);
      socket.emit("transcribe-error", { error: error.message });
    }
  });

  // 사용자 정보 설정
  socket.on("set-user", (userId: string) => {
    console.log(`👤 [set-user] Socket ${socket.id} set user ID: ${userId}`);
    (socket as any).userId = userId;
    console.log(`📝 [set-user] Socket ${socket.id} user data updated:`, {
      socketId: socket.id,
      userId: userId,
      roomId: (socket as any).roomId,
    });
  });

  // 파일 기반 녹음 시작
  socket.on("start-file-recording", () => {
    console.log(`🎙️ [start-file-recording] Socket ${socket.id} started file recording`);
    (socket as any).audioChunks = [];
    (socket as any).isRecording = true;
  });

  // 오디오 청크 수신
  socket.on("audio-chunk", (chunk: Buffer) => {
    if ((socket as any).isRecording) {
      if (!(socket as any).audioChunks) {
        (socket as any).audioChunks = [];
      }
      (socket as any).audioChunks.push(chunk);
    }
  });

  // 파일 기반 녹음 중지 및 STT 처리
  socket.on("stop-file-recording", async () => {
    const roomId = (socket as any).roomId;
    const userId = (socket as any).userId || "anonymous";
    const audioChunks = (socket as any).audioChunks || [];

    console.log(`🛑 [stop-file-recording] Socket ${socket.id} stopped recording`);
    (socket as any).isRecording = false;

    if (!roomId || audioChunks.length === 0) {
      socket.emit("file-transcribe-error", { error: "No audio data or room" });
      return;
    }

    try {
      // 오디오 청크들을 하나의 버퍼로 합치기
      const audioBuffer = Buffer.concat(audioChunks);
      const fileName = `${roomId}-${Date.now()}.wav`;

      // STT 처리
      const recordingStartTime = new Date();
      const segments = await fileTranscribeService.transcribeAudioFile(audioBuffer, fileName);
      console.log(`📝 [file-transcribe] Segment results:`, segments);

      // 각 세그먼트를 개별 메시지로 저장
      for (const segment of segments) {
        if (segment.transcript.trim()) {
          // 세그먼트 종료 시간을 기준으로 실제 메시지 시간 계산
          const segmentEndSeconds = parseFloat(segment.end_time);
          const messageTime = new Date(recordingStartTime.getTime() + (segmentEndSeconds * 1000));
          const mysqlTime = messageTime.toISOString().slice(0, 19).replace('T', ' ');
          
          const [result]: any = await db.execute(
            "INSERT INTO messages (room_id, user_id, message, message_type, created_at) VALUES (?, ?, ?, ?, ?)",
            [roomId, userId, segment.transcript, "text", mysqlTime]
          );

          // 채팅방의 모든 사용자에게 메시지 전송
          io.to(roomId).emit("chat-message", {
            id: result.insertId,
            userId,
            message: segment.transcript,
            messageType: "text",
            timestamp: messageTime.toISOString(),
          });

          console.log(`✅ [file-transcribe] Segment saved: "${segment.transcript}" at ${messageTime.toISOString()}`);
        }
      }

      // 클라이언트에 완료 알림
      socket.emit("file-transcribe-complete");

      // 오디오 청크 초기화
      (socket as any).audioChunks = [];
    } catch (error: any) {
      console.error(`❌ [file-transcribe] Error:`, error);
      socket.emit("file-transcribe-error", { error: error.message });
    }
  });

  socket.on("disconnect", (reason) => {
    const roomId = (socket as any).roomId;
    const userId = (socket as any).userId;

    console.log(`🔌 [disconnect] Socket ${socket.id} disconnected:`, {
      reason,
      roomId,
      userId,
      duration: Date.now() - (Number(socket.handshake.time) || Date.now()),
    });

    if (roomId) {
      console.log(
        `👥 [disconnect] Room ${roomId} now has ${
          (io.sockets.adapter.rooms.get(roomId)?.size || 1) - 1
        } members`
      );
    }

    // 음성 전사 정리
    try {
      transcribeService.stopTranscription(socket.id);
      console.log(`🧹 [disconnect] Cleaned up transcription for ${socket.id}`);
    } catch (error) {
      console.log(
        `⚠️ [disconnect] No active transcription to clean up for ${socket.id}`
      );
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
