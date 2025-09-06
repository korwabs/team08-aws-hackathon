import { useState, useRef, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'

interface UserAvatarProps {
  onLogout: () => void
}

export default function UserAvatar({ onLogout }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg flex-shrink-0"
      >
        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 sm:w-44 md:w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">사용자</p>
            <p className="text-xs text-gray-500 truncate">user@deepvibe.com</p>
          </div>
          <button
            onClick={() => {
              onLogout()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50/80 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
