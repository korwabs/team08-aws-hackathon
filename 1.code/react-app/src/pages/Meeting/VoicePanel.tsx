import { useState, useRef, useEffect } from 'react'

interface VoicePanelProps {
  meetingId: string
}

export default function VoicePanel({ meetingId }: VoicePanelProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Web Speech API 설정
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'ko-KR'

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => [...prev, finalTranscript])
          }
        }
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // MediaRecorder 설정
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.start()
      
      // Speech Recognition 시작
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
      
      setIsRecording(true)
    } catch (error) {
      console.error('Recording failed:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    setIsRecording(false)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Voice Recording</h2>
        <p className="text-sm text-gray-600">Meeting ID: {meetingId}</p>
      </div>

      {/* 음성 녹음 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 녹음 컨트롤 */}
        <div className="mb-6 text-center">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isRecording ? (
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
        </div>

        {/* 실시간 텍스트 표시 영역 */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Live Transcript</h3>
          <div className="h-full overflow-y-auto text-sm text-gray-600 space-y-2">
            {transcript.length === 0 ? (
              <p className="italic">Transcript will appear here...</p>
            ) : (
              transcript.map((text, index) => (
                <p key={index} className="border-l-2 border-blue-200 pl-3 py-1">
                  {text}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
