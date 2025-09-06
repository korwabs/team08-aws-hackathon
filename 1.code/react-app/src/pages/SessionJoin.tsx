import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

export default function SessionJoin() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    // URL에서 세션 ID 추출
    const pathSegments = window.location.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]
    setSessionId(id)
    
    // Auto-redirect to main app with session ID
    if (id) {
      const mainAppUrl = `${window.location.origin}?join=${id}`
      window.location.href = mainAppUrl
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Joining DeepVibe Session
        </h1>
        <p className="text-gray-600 mb-4">
          Session ID: {sessionId}
        </p>
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    </div>
  )
}
