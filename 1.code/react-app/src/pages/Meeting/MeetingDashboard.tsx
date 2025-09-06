import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
} from '../../components/ui'
import { Plus, Video, FileCode, Users, Calendar, Mic, Zap, ArrowRight } from 'lucide-react'
import { useCreateRoom, useRooms } from '../../hooks/useApi'
import UserAvatar from '../../components/UserAvatar'

interface MeetingDashboardProps {
  onCreateMeeting: (roomId: string) => void
  onJoinMeeting: (meetingId: string) => void
  onLogout: () => void
}

export function MeetingDashboard({ onCreateMeeting, onJoinMeeting, onLogout }: MeetingDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [participantCount, setParticipantCount] = useState('')
  
  const createRoomMutation = useCreateRoom()
  const { data: rooms = [], isLoading } = useRooms()

  const handleCreateMeeting = async () => {
    if (meetingTitle && participantCount) {
      try {
        const result = await createRoomMutation.mutateAsync({ 
          name: meetingTitle,
          participants: parseInt(participantCount)
        })
        setIsModalOpen(false)
        setMeetingTitle('')
        setParticipantCount('')
        onCreateMeeting(result.id)
      } catch (error) {
        console.error('Failed to create room:', error)
      }
    }
  }

  const totalMeetings = rooms.length
  const totalDemos = rooms.reduce((sum: number, room: any) => sum + (room.html_count || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Logo with gradient background */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DeepVibe
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-lg hidden sm:block">
                  🎤 Voice to Demo • ⚡ Real-time Collaboration
                </p>
              </div>
            </div>
            
            {/* CTA Button with Avatar */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                <Mic className="w-4 h-4" />
                <span>Ready to transform ideas</span>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)} 
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Start New Session</span>
                <span className="sm:hidden">Start</span>
              </Button>
              <UserAvatar onLogout={onLogout} />
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white/60 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-200">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              <span className="hidden sm:inline">Real-time Voice Processing</span>
              <span className="sm:hidden">Voice</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white/60 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-200">
              <FileCode className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
              <span className="hidden sm:inline">Instant Demo Generation</span>
              <span className="sm:hidden">Demo</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-white/60 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-200">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              <span className="hidden sm:inline">Collaborative Design</span>
              <span className="sm:hidden">Collab</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="flex justify-center gap-6 sm:grid sm:grid-cols-2 sm:gap-6 max-w-2xl mx-auto mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-blue-900">{totalMeetings}</span>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-md">
              <FileCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-purple-900">{totalDemos}</span>
          </div>

          <Card className="hidden sm:block border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-900">{totalMeetings}</p>
                  <p className="text-lg text-blue-700">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hidden sm:block border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileCode className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-900">{totalDemos}</p>
                  <p className="text-lg text-purple-700">Generated Demos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Recent Sessions</h2>
            <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No sessions yet</p>
              <p className="text-gray-400">Create your first session to get started!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rooms.map((room: any) => (
                <Card key={room.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{room.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span>{room.participants}</span>
                            <span className="hidden sm:inline">participants</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-purple-500" />
                            <span>{room.html_count || 0}</span>
                            <span className="hidden sm:inline">demos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-500" />
                            <span>{new Date(room.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => onJoinMeeting(room.id)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <ArrowRight className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Join Session</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Meeting Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Start New Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Enter meeting title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participants">Number of Participants</Label>
              <Input
                id="participants"
                type="number"
                placeholder="Enter participant count"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateMeeting} 
              disabled={!meetingTitle || !participantCount || createRoomMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {createRoomMutation.isPending ? 'Creating...' : 'Start Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
