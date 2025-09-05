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

  const startTranscribe = (languageCode = 'ko-KR') => {
    if (globalSocket) {
      globalSocket.emit('start-transcribe', { languageCode })
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
      globalSocket.on('new-message', callback)
      return () => globalSocket?.off('new-message', callback)
    }
    return () => {}
  }

  const onTranscribeStarted = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('transcribe-started', callback)
      return () => globalSocket?.off('transcribe-started', callback)
    }
    return () => {}
  }

  const onTranscribeResult = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('transcribe-result', callback)
      return () => globalSocket?.off('transcribe-result', callback)
    }
    return () => {}
  }

  const onTranscribeStopped = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('transcribe-stopped', callback)
      return () => globalSocket?.off('transcribe-stopped', callback)
    }
    return () => {}
  }

  const onTranscribeError = (callback: (data: any) => void) => {
    if (globalSocket) {
      globalSocket.on('transcribe-error', callback)
      return () => globalSocket?.off('transcribe-error', callback)
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
    onTranscribeStarted,
    onTranscribeResult,
    onTranscribeStopped,
    onTranscribeError,
  }
}
