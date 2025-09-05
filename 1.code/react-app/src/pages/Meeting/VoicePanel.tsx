import { useState, useRef, useEffect } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { useMessages } from '../../hooks/useApi'

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const userId = 'user-' + Date.now() // 임시 사용자 ID
  const socket = useSocket({ roomId: meetingId, userId })
  const { data: messagesData, isLoading } = useMessages(meetingId)

  // 서버 메시지와 실시간 메시지 합치기
  const allMessages = [
    ...(messagesData?.messages || []),
    ...realtimeMessages
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  useEffect(() => {
    // 메시지 수신 리스너
    const unsubscribeMessage = socket.onMessage((data) => {
      setRealtimeMessages(prev => [...prev, data])
    })

    // 음성인식 결과 수신 리스너
    const unsubscribeTranscription = socket.onTranscription((data) => {
      setRealtimeMessages(prev => [...prev, {
        id: Date.now(),
        user_id: userId,
        message: data.text || data.transcript,
        message_type: 'transcribe',
        created_at: new Date().toISOString()
      }])
    })

    return () => {
      unsubscribeMessage()
      unsubscribeTranscription()
    }
  }, [socket, userId])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          // 실시간으로 오디오 데이터 전송
          event.data.arrayBuffer().then(buffer => {
            socket.sendAudioData(buffer)
          })
        }
      }
      
      // 음성인식 시작
      socket.startTranscribe('ko-KR')
      
      // 100ms마다 데이터 수집
      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      
    } catch (error) {
      console.error('Recording failed:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    socket.stopTranscribe()
    setIsRecording(false)
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
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-80">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Live Messages</h3>
          <div className="h-64 overflow-y-auto text-sm space-y-3">
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
                  <p className="text-gray-800">{message.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
