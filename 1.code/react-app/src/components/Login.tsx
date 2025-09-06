import { useState } from 'react'
import { Zap } from 'lucide-react'

interface LoginProps {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 임시 로그인 처리 - 실제 API 연동 시 수정
      setTimeout(() => {
        const mockToken = 'mock-jwt-token'
        localStorage.setItem('token', mockToken)
        onLogin(mockToken)
        setLoading(false)
      }, 1000)
    } catch (error) {
      alert('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-2 sm:mb-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            DeepVibe
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 px-1 sm:px-2">
            🎤 Voice to Demo • ⚡ Real-time
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl shadow-xl border border-gray-200/50">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
            로그인
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 text-sm"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 text-sm"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-2.5 md:py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Feature highlights */}
          <div className="mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-4 md:pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2 sm:mb-3">DeepVibe로 할 수 있는 것들</p>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span>실시간 음성 처리 및 텍스트 변환</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span>자동 HTML 데모 생성</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>실시간 협업 및 피드백</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
