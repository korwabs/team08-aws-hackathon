import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '../../hooks/useSocket'
import { useMessages, queryKeys } from '../../hooks/useApi'

interface VoicePanelProps {
  meetingId: string
}

interface Message {
  id: number
  user_id: string
  message: string
  message_type: 'text' | 'transcribe'
  created_at: string
}

export default function VoicePanel({ meetingId }: VoicePanelProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([])
  const [status, setStatus] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const userId = 'user-' + Date.now()
  const socket = useSocket({ roomId: meetingId, userId })
  const { data: messagesData, isLoading } = useMessages(meetingId)
  const queryClient = useQueryClient()

  // 서버 메시지와 실시간 메시지 합치기
  const allMessages = [
    ...(messagesData?.messages || []),
    ...realtimeMessages
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // 이미지 URL인지 확인하는 함수
  const isImageUrl = (text: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    return imageExtensions.some(ext => text.toLowerCase().includes(ext))
  }

  // 메시지가 변경될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  useEffect(() => {
    // 메시지 수신 리스너
    const unsubscribeMessage = socket.onMessage((message) => {
      setRealtimeMessages(prev => [...prev, message])
    })

    // 파일 녹음 시작 확인
    const unsubscribeStarted = socket.onFileRecordingStarted(() => {
      setStatus('🎤 녹음 중...')
    })

    // 파일 녹음 중지 및 STT 결과
    const unsubscribeStopped = socket.onFileRecordingStopped(() => {
      setStatus('STT 처리 중...')
    })

    // STT 완료 결과
    const unsubscribeTranscribeComplete = socket.onFileTranscribeComplete(() => {
      setStatus('STT 완료')
      // 메시지 쿼리 무효화하여 새 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(meetingId) })
      setTimeout(() => setStatus(''), 2000)
    })

    // STT 에러
    const unsubscribeError = socket.onSttError((error) => {
      setStatus(`오류: ${error.error}`)
      stopRecording()
    })

    return () => {
      unsubscribeMessage()
      unsubscribeStarted()
      unsubscribeStopped()
      unsubscribeTranscribeComplete()
      unsubscribeError()
    }
  }, [socket])

  const startRecording = async () => {
    try {
      if (!socket.isConnected) {
        setStatus('서버에 연결 중입니다...')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          sampleRate: 16000, 
          channelCount: 1 
        }
      })
      
      audioStreamRef.current = stream
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          
          // 청크를 ArrayBuffer로 변환하여 전송
          event.data.arrayBuffer().then(buffer => {
            const uint8Array = new Uint8Array(buffer)
            socket.sendAudioChunk(uint8Array)
          })
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // 1초마다 청크 생성
      
      setIsRecording(true)
      setStatus('녹음을 시작합니다...')
      
      socket.startFileRecording()
      
    } catch {
      setStatus('마이크 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
    
    socket.stopFileRecording()
    
    setIsRecording(false)
    setStatus('녹음 완료, STT 처리 중...')
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Voice Recording</h2>
        <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
        <p className="text-xs text-gray-500">
          Status: {socket.isConnected ? 'Connected' : 'Connecting...'}
        </p>
        {status && (
          <p className="text-xs text-blue-600 mt-1">{status}</p>
        )}
      </div>

      {/* 음성 녹음 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 녹음 컨트롤 */}
        <div className="mb-6 text-center">
          <div className="relative inline-block">
            {/* 외부 펄스 링 */}
            {isRecording && (
              <>
                <div className="absolute inset-0 w-16 h-16 bg-red-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-0 w-16 h-16 bg-red-300 rounded-full animate-pulse opacity-50" style={{animationDelay: '0.5s'}}></div>
              </>
            )}
            
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!socket.isConnected}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                !socket.isConnected 
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isRecording 
                  ? 'bg-red-600 hover:bg-red-700 scale-110 shadow-lg shadow-red-500/50' 
                  : 'bg-red-500 hover:bg-red-600 hover:scale-105'
              }`}
            >
              {isRecording ? (
                <div className="w-4 h-4 bg-white rounded-sm animate-pulse"></div>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          <p className={`mt-2 text-sm transition-colors duration-300 ${
            isRecording ? 'text-red-600 font-medium' : 'text-gray-600'
          }`}>
            {!socket.isConnected 
              ? 'Connecting...' 
              : isRecording 
              ? '🔴 Recording... Click to stop' 
              : 'Click to start recording'
            }
          </p>
        </div>

        {/* 실시간 메시지 표시 영역 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-120">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Live Messages</h3>
          <div className="h-96 overflow-y-auto text-sm space-y-3">
            {isLoading ? (
              <p className="italic text-gray-500">Loading messages...</p>
            ) : allMessages.length === 0 ? (
              <p className="italic text-gray-500">Messages will appear here...</p>
            ) : (
              allMessages.map((message) => (
                <div key={message.id} className={`p-3 rounded-lg ${
                  message.message_type === 'transcribe' 
                    ? 'bg-blue-50 border-l-4 border-blue-400' 
                    : 'bg-gray-50 border-l-4 border-gray-400'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {message.message_type === 'transcribe' ? '🎤 Voice' : '💬 Text'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {isImageUrl(message.message) ? (
                    <div className="space-y-2">
                      <img 
                        src={message.message} 
                        alt="Uploaded image" 
                        className="w-32 h-24 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(message.message)}
                        onError={(e) => {
                          // 이미지 로드 실패 시 텍스트로 표시
                          const target = e.currentTarget as HTMLImageElement
                          target.style.display = 'none'
                          const nextElement = target.nextElementSibling as HTMLElement
                          if (nextElement) nextElement.style.display = 'block'
                        }}
                      />
                      <p className="text-gray-800 text-xs hidden">{message.message}</p>
                    </div>
                  ) : (
                    <p className="text-gray-800">{message.message}</p>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-2/3 h-2/3 p-4">
            <img 
              src={selectedImage} 
              alt="Full size image" 
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
