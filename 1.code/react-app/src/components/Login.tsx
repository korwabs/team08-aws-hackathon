import { useState } from 'react'
import { tokens } from '../tokens/design-tokens'

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
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: tokens.colors.surface }}
    >
      <div 
        className="w-full max-w-md p-8 shadow-lg"
        style={{ 
          backgroundColor: tokens.colors.background,
          borderRadius: tokens.borderRadius.md 
        }}
      >
        <h2 
          className="text-center font-bold mb-8"
          style={{ 
            fontSize: tokens.fontSize['2xl'],
            color: tokens.colors.text 
          }}
        >
          로그인
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: tokens.fontSize.sm,
                color: tokens.colors.text 
              }}
            >
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: tokens.colors.border,
                borderRadius: tokens.borderRadius.sm,
                fontSize: tokens.fontSize.base
              }}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>
          
          <div>
            <label 
              className="block mb-2 font-medium"
              style={{ 
                fontSize: tokens.fontSize.sm,
                color: tokens.colors.text 
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border focus:outline-none focus:ring-2 transition-colors"
              style={{
                borderColor: tokens.colors.border,
                borderRadius: tokens.borderRadius.sm,
                fontSize: tokens.fontSize.base
              }}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-medium text-white transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: loading ? tokens.colors.textSecondary : tokens.colors.primary,
              borderRadius: tokens.borderRadius.sm,
              fontSize: tokens.fontSize.base,
              marginTop: tokens.spacing.xl
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = tokens.colors.primaryHover
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = tokens.colors.primary
              }
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
