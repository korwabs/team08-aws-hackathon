import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = 'wss://d2k05d66hwbq2e.cloudfront.net'

interface UseSocketProps {
  roomId?: string
  userId?: string
}

export const useSocket = ({ roomId, userId }: UseSocketProps = {}) => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL)

    socketRef.current.on('connect', () => {
      setIsConnected(true)
      if (roomId && userId) {
        socketRef.current?.emit('join-room', { roomId, userId })
      }
    })

    socketRef.current.on('disconnect', () => {
      setIsConnected(false)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [roomId, userId])

  const sendMessage = (message: string) => {
    if (roomId && userId) {
      socketRef.current?.emit('chat-message', { roomId, userId, message })
    }
  }

  const startTranscribe = (languageCode = 'ko-KR') => {
    socketRef.current?.emit('start-transcribe', { languageCode })
  }

  const sendAudioData = (audioData: ArrayBuffer) => {
    socketRef.current?.emit('audio-data', { audio: audioData })
  }

  const stopTranscribe = () => {
    socketRef.current?.emit('stop-transcribe')
  }

  const onMessage = (callback: (data: any) => void) => {
    socketRef.current?.on('message-received', callback)
    return () => socketRef.current?.off('message-received', callback)
  }

  const onTranscription = (callback: (data: any) => void) => {
    socketRef.current?.on('transcription-result', callback)
    return () => socketRef.current?.off('transcription-result', callback)
  }

  const onUserJoined = (callback: (data: any) => void) => {
    socketRef.current?.on('user-joined', callback)
    return () => socketRef.current?.off('user-joined', callback)
  }

  const onUserLeft = (callback: (data: any) => void) => {
    socketRef.current?.on('user-left', callback)
    return () => socketRef.current?.off('user-left', callback)
  }

  return {
    socket: socketRef.current,
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
