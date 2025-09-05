export interface Room {
  id: string
  name: string
  participants: number
  created_at: string
  message_count?: number
  image_count?: number
  html_count?: number
}

export interface Message {
  id: number
  room_id: string
  user_id: string
  message: string
  message_type: 'text' | 'transcribe'
  created_at: string
}

export type CreateRoom = {
  name: string
  participants?: number
}

export interface MessagesResponse {
  messages: Message[]
  imageUrls: string[]
}

export interface UploadResponse {
  url: string
  messageId: number
}

export interface SummaryResponse {
  summary: string
  messageCount: number
  imageCount: number
}
