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
        
        // 연결 후 사용자 설정 및 룸 참여 처리
        if (userId) {
          setTimeout(() => {
            if (globalSocket?.connected) {
              globalSocket.emit('set-user', userId)
              hasSetUser.current = true
              
              if (roomId) {
                setTimeout(() => {
                  if (globalSocket?.connected) {
                    globalSocket.emit('join-room', roomId)
                    hasJoinedRoom.current = true
                  }
                }, 50)
              }
            }
          }, 50)
        }
      })

      globalSocket.on('disconnect', () => {
        setIsConnected(false)
        hasJoinedRoom.current = false
        hasSetUser.current = false
      })

      globalSocket.on('connect_error', () => {
        // Error handling without logging
      })
    } else if (globalSocket.connected) {
      setIsConnected(true)
      
      // 이미 연결된 상태에서 새로운 룸/사용자 설정
      if (userId && !hasSetUser.current) {
        globalSocket.emit('set-user', userId)
        hasSetUser.current = true
      }
      
      if (roomId && hasSetUser.current && !hasJoinedRoom.current) {
        globalSocket.emit('join-room', roomId)
        hasJoinedRoom.current = true
      }
    }

    return () => {
      // 컴포넌트 언마운트 시에도 소켓을 유지
    }
  }, [roomId, userId])

  const sendMessage = (message: string) => {
    if (roomId && userId && globalSocket) {
      globalSocket.emit('chat-message', { roomId, userId, message })
    }
  }

  const startFileRecording = () => {
    if (globalSocket) {
      globalSocket.emit('start-file-recording')
    }
  }

  const sendAudioChunk = (chunk: Uint8Array) => {
    if (globalSocket) {
      globalSocket.emit('audio-chunk', chunk)
    }
  }

  const stopFileRecording = () => {
    if (globalSocket) {
      globalSocket.emit('stop-file-recording')
    }
  }

  const onMessage = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('new-message', callback)
      return () => globalSocket?.off('new-message', callback)
    }
    return () => {}
  }

  const onFileRecordingStarted = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('file-recording-started', callback)
      return () => globalSocket?.off('file-recording-started', callback)
    }
    return () => {}
  }

  const onFileRecordingStopped = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('file-recording-stopped', callback)
      return () => globalSocket?.off('file-recording-stopped', callback)
    }
    return () => {}
  }

  const onFileTranscribeComplete = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('file-transcribe-complete', callback)
      return () => globalSocket?.off('file-transcribe-complete', callback)
    }
    return () => {}
  }

  const onSttError = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('stt-error', callback)
      return () => globalSocket?.off('stt-error', callback)
    }
    return () => {}
  }

  // HTML Demo 관련 함수들
  const generateHtmlDemo = (options?: { imageUrl?: string; prdUrl?: string; htmlUrl?: string }) => {
    if (roomId && userId && globalSocket) {
      globalSocket.emit('generate-html-demo', {
        roomId,
        userId,
        ...options
      })
    }
  }

  const onHtmlDemoProgress = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('html-demo-progress', callback)
      return () => globalSocket?.off('html-demo-progress', callback)
    }
    return () => {}
  }

  const onHtmlDemoComplete = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('html-demo-complete', callback)
      return () => globalSocket?.off('html-demo-complete', callback)
    }
    return () => {}
  }

  const onHtmlDemoError = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('html-demo-error', callback)
      return () => globalSocket?.off('html-demo-error', callback)
    }
    return () => {}
  }

  return {
    socket: globalSocket,
    isConnected,
    sendMessage,
    startFileRecording,
    sendAudioChunk,
    stopFileRecording,
    onMessage,
    onFileRecordingStarted,
    onFileRecordingStopped,
    onFileTranscribeComplete,
    onSttError,
    generateHtmlDemo,
    onHtmlDemoProgress,
    onHtmlDemoComplete,
    onHtmlDemoError,
  }
}
