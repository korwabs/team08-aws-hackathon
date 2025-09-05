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
  const [transcribeText, setTranscribeText] = useState('')
  const [status, setStatus] = useState('')
  
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const userId = 'user-' + Date.now()
  const socket = useSocket({ roomId: meetingId, userId })
  const { data: messagesData, isLoading } = useMessages(meetingId)

  // 서버 메시지와 실시간 메시지 합치기
  const allMessages = [
    ...(messagesData?.messages || []),
    ...realtimeMessages
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // 메시지가 변경될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages])

  useEffect(() => {
    // 메시지 수신 리스너
    const unsubscribeMessage = socket.onMessage((message) => {
      setRealtimeMessages(prev => [...prev, message])
    })

    // 음성인식 시작 확인
    const unsubscribeStarted = socket.onTranscribeStarted((result) => {
      setStatus('🎤 음성인식 중...')
    })

    // 실시간 전사 결과
    const unsubscribeResult = socket.onTranscribeResult((result) => {
      setTranscribeText(result.transcript)
      
      if (!result.isPartial) {
        // 최종 결과는 자동으로 메시지가 되므로 2초 후 텍스트 지움
        setTimeout(() => {
          setTranscribeText('')
        }, 2000)
      }
    })

    // 음성인식 중지 확인
    const unsubscribeStopped = socket.onTranscribeStopped(() => {
      setStatus('음성인식이 중지되었습니다.')
      setTranscribeText('')
    })

    // 음성인식 에러
    const unsubscribeError = socket.onTranscribeError((error) => {
      setStatus(`오류: ${error.error}`)
      stopRecording()
    })

    return () => {
      unsubscribeMessage()
      unsubscribeStarted()
      unsubscribeResult()
      unsubscribeStopped()
      unsubscribeError()
    }
  }, [socket])

  const startRecording = async () => {
    try {
      // 소켓 연결 및 룸 참여 확인
      if (!socket.isConnected) {
        setStatus('서버에 연결 중입니다...')
        return
      }

      // 1. 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          sampleRate: 16000, 
          channelCount: 1 
        }
      })
      
      // 2. 오디오 컨텍스트 설정
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      // 3. 실시간 오디오 데이터 처리
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        
        // Float32Array를 16-bit PCM으로 변환
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
        }
        
        // 서버로 오디오 데이터 전송
        socket.sendAudioData(pcmData.buffer)
      }
      
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      // 참조 저장
      audioStreamRef.current = stream
      audioContextRef.current = audioContext
      processorRef.current = processor
      
      setIsRecording(true)
      setStatus('음성인식을 시작합니다...')
      
      // 4. 약간의 지연 후 서버에 음성인식 시작 요청 (오디오 설정 완료 대기)
      setTimeout(() => {
        if (socket.isConnected) {
          socket.startTranscribe('ko-KR')
        }
      }, 100)
      
    } catch (error) {
      setStatus('마이크 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    // 1. 오디오 스트림 중지
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
    
    // 2. 오디오 컨텍스트 종료
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    // 3. 프로세서 정리
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }
    
    // 4. 서버에 중지 요청
    socket.stopTranscribe()
    
    setIsRecording(false)
    setStatus('')
    setTranscribeText('')
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

          {/* 실시간 전사 텍스트 */}
          {transcribeText && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">실시간 전사:</p>
              <p className="text-blue-700">{transcribeText}</p>
            </div>
          )}
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
                  <p className="text-gray-800">{message.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
