import { useState } from 'react'
import { MeetingDashboard } from './MeetingDashboard'
import { Button } from '../../components/ui'
import { 
  ArrowLeft,
  Share,
  Zap,
  Users,
  Mic,
  Monitor
} from 'lucide-react'
import VoicePanel from './VoicePanel'
import DemoPanel from './DemoPanel'
import FloatingDemoButton from './FloatingDemoButton'
import UserAvatar from '../../components/UserAvatar'
import { useShare } from '../../hooks/useShare'

interface MeetingRoomProps {
  meetingId: string
  onLogout: () => void
  autoJoin?: boolean
}

export default function MeetingRoom({ meetingId, onLogout, autoJoin }: MeetingRoomProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'demo'>(autoJoin ? 'demo' : 'dashboard')
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(autoJoin ? meetingId : null)
  const userId = 'user-' + Date.now() // 임시 사용자 ID
  const { shareSession, isSharing } = useShare()

  const handleCreateMeeting = (roomId: string) => {
    setCurrentMeetingId(roomId)
    setCurrentView('demo')
  }

  const handleJoinMeeting = (meetingId: string) => {
    setCurrentMeetingId(meetingId)
    setCurrentView('demo')
  }

  const handleLeaveMeeting = () => {
    setCurrentView('dashboard')
    setCurrentMeetingId(null)
  }

  if (currentView === 'dashboard') {
    return (
      <MeetingDashboard 
        onCreateMeeting={handleCreateMeeting}
        onJoinMeeting={handleJoinMeeting}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLeaveMeeting}
                className="hover:bg-gray-100 rounded-xl p-2"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo with gradient background */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DeepVibe Session
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">ID: {currentMeetingId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
                <Users className="w-4 h-4" />
                <span>Live Session</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => shareSession(currentMeetingId || meetingId)}
                disabled={isSharing}
                className="border-gray-300 hover:bg-gray-50 rounded-xl text-xs sm:text-sm px-2 sm:px-3"
              >
                <Share className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">{isSharing ? 'Sharing...' : 'Share'}</span>
              </Button>
              <UserAvatar onLogout={onLogout} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* 좌측: 음성 녹음 + 실시간 텍스트 */}
        <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-200 bg-white/50 flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white/80">
            <div className="flex items-center gap-2 text-blue-600">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              <h2 className="font-semibold text-sm sm:text-base">Voice Input</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Real-time voice processing</p>
          </div>
          <div className="flex-1 min-h-0">
            <VoicePanel meetingId={currentMeetingId || meetingId} />
          </div>
        </div>

        {/* 우측: 생성된 데모 표시 */}
        <div className="w-full sm:w-1/2 bg-white/50 flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white/80">
            <div className="flex items-center gap-2 text-purple-600">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
              <h2 className="font-semibold text-sm sm:text-base">Generated Demo</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Interactive prototype preview</p>
          </div>
          <div className="flex-1 min-h-0">
            <DemoPanel meetingId={currentMeetingId || meetingId} />
          </div>
        </div>

        {/* 플로팅 데모 생성 버튼 */}
        {currentMeetingId && (
          <FloatingDemoButton 
            meetingId={currentMeetingId}
            userId={userId}
          />
        )}
      </div>
    </div>
  )
}
