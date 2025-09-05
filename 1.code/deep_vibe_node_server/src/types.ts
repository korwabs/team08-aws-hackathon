// 채팅방 타입
export interface ChatRoom {
  id: string;
  name: string;
  created_at: string;
}

// 메시지 타입
export interface Message {
  id: number;
  room_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'transcribe';
  created_at: string;
}

// WebSocket 이벤트 데이터 타입
export interface ChatMessageData {
  roomId: string;
  userId: string;
  message: string;
}

export interface TranscribeStartData {
  languageCode?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Socket 확장 타입
declare module 'socket.io' {
  interface Socket {
    roomId?: string;
    userId?: string;
  }
}
