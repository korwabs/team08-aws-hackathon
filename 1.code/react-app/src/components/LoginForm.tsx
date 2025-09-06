import { useState } from 'react';
import { tokens } from '../tokens/design-tokens';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
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
          className="text-center font-bold mb-6"
          style={{ 
            fontSize: tokens.fontSize['2xl'],
            color: tokens.colors.text 
          }}
        >
          로그인
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border focus:outline-none focus:ring-2"
              style={{
                borderColor: tokens.colors.border,
                borderRadius: tokens.borderRadius.sm,
                fontSize: tokens.fontSize.base,
                focusRingColor: tokens.colors.primary
              }}
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
              className="w-full px-3 py-2 border focus:outline-none focus:ring-2"
              style={{
                borderColor: tokens.colors.border,
                borderRadius: tokens.borderRadius.sm,
                fontSize: tokens.fontSize.base
              }}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 font-medium text-white transition-colors hover:opacity-90"
            style={{
              backgroundColor: tokens.colors.primary,
              borderRadius: tokens.borderRadius.sm,
              fontSize: tokens.fontSize.base,
              marginTop: tokens.spacing.lg
            }}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};
