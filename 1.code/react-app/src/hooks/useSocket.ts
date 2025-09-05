import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'wss://d2k05d66hwbq2e.cloudfront.net'

interface UseSocketProps {
  roomId?: string
  userId?: string
}

// 전역 소켓 인스턴스
let globalSocket: Socket | null = null

export const useSocket = ({ roomId, userId }: UseSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const hasJoinedRoom = useRef(false)
  const hasSetUser = useRef(false)

  useEffect(() => {
    // 소켓이 없거나 연결이 끊어진 경우에만 새로 생성
    if (!globalSocket || globalSocket.disconnected) {
      globalSocket = io(SOCKET_URL)
      
      globalSocket.on('connect', () => {
        setIsConnected(true)
        hasSetUser.current = false
        hasJoinedRoom.current = false
      })

      globalSocket.on('disconnect', () => {
        setIsConnected(false)
        hasJoinedRoom.current = false
        hasSetUser.current = false
      })
    } else if (globalSocket.connected) {
      setIsConnected(true)
    }

    // 사용자 ID 설정 (한 번만)
    if (userId && globalSocket.connected && !hasSetUser.current) {
      globalSocket.emit('set-user', userId)
      hasSetUser.current = true
    }

    // 룸 참여 (한 번만)
    if (roomId && userId && globalSocket.connected && !hasJoinedRoom.current && hasSetUser.current) {
      globalSocket.emit('join-room', { roomId, userId })
      hasJoinedRoom.current = true
    }

    return () => {
      // 컴포넌트 언마운트 시에도 소켓을 유지
      // 필요시에만 disconnect 호출
    }
  }, [roomId, userId])

  const sendMessage = (message: string) => {
    if (roomId && userId && globalSocket) {
      globalSocket.emit('chat-message', { roomId, userId, message })
    }
  }

  const startTranscribe = (languageCode = 'ko-KR') => {
    if (roomId && userId && globalSocket) {
      globalSocket.emit('start-transcribe', { roomId, userId, languageCode })
    }
  }

  const sendAudioData = (audioData: ArrayBuffer) => {
    if (globalSocket) {
      globalSocket.emit('audio-data', audioData)
    }
  }

  const stopTranscribe = () => {
    if (globalSocket) {
      globalSocket.emit('stop-transcribe')
    }
  }

  const onMessage = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('message-received', callback)
      return () => globalSocket?.off('message-received', callback)
    }
    return () => {}
  }

  const onTranscription = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('transcription-result', callback)
      return () => globalSocket?.off('transcription-result', callback)
    }
    return () => {}
  }

  const onUserJoined = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('user-joined', callback)
      return () => globalSocket?.off('user-joined', callback)
    }
    return () => {}
  }

  const onUserLeft = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('user-left', callback)
      return () => globalSocket?.off('user-left', callback)
    }
    return () => {}
  }

  return {
    socket: globalSocket,
    isConnected,
    sendMessage,
    startTranscribe,
    sendAudioData,
    stopTranscribe,
    onMessage,
    onTranscription,
    onUserJoined,
    onUserLeft,
  }
}
