import { useState } from 'react'
import { MeetingDashboard } from './MeetingDashboard'
import { Button } from '../../components/ui'
import { 
  ArrowLeft,
  Share
} from 'lucide-react'
import VoicePanel from './VoicePanel'
import DemoPanel from './DemoPanel'
import FloatingDemoButton from './FloatingDemoButton'

interface MeetingRoomProps {
  meetingId: string
}

export default function MeetingRoom({ meetingId }: MeetingRoomProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'demo'>('dashboard')
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null)
  const userId = 'user-' + Date.now() // 임시 사용자 ID

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
      />
    )
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 border-b border-border bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLeaveMeeting}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="DeepVibe" className="w-8 h-8" />
                <div>
                  <h1 className="text-xl font-semibold text-foreground">DeepVibe Session</h1>
                  <p className="text-sm text-muted-foreground">ID: {currentMeetingId}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 w-full">
        {/* 좌측: 음성 녹음 + 실시간 텍스트 */}
        <div className="w-1/2 border-r border-border float-left h-full">
          <VoicePanel meetingId={currentMeetingId || meetingId} />
        </div>

        {/* 우측: 생성된 데모 표시 */}
        <div className="w-1/2 float-right h-full">
          <DemoPanel meetingId={currentMeetingId || meetingId} />
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
