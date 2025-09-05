import React, { useState } from 'react'
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
import { Plus, Video, FileCode, Users, Clock, Calendar } from 'lucide-react'
import { useCreateRoom, useRooms } from '../../hooks/useApi'

interface MeetingDashboardProps {
  onCreateMeeting: (roomId: string) => void
  onJoinMeeting: (meetingId: string) => void
}

export function MeetingDashboard({ onCreateMeeting, onJoinMeeting }: MeetingDashboardProps) {
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
  const totalDemos = rooms.reduce((sum, room) => sum + (room.html_count || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="DeepVibe" className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">DeepVibe Dashboard</h1>
                <p className="text-muted-foreground mt-2">Transform voice conversations into interactive demos</p>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Start New Session
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{totalMeetings}</p>
                  <p className="text-lg text-muted-foreground">Total Meetings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center">
                  <FileCode className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{totalDemos}</p>
                  <p className="text-lg text-muted-foreground">Created Demos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Recent Sessions</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions yet. Create your first session!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground mb-1">{room.name}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.participants} participants
                          </div>
                          <div className="flex items-center gap-1">
                            <FileCode className="w-3 h-3" />
                            {room.html_count || 0} demos
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(room.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => onJoinMeeting(room.id)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Join Session
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
            <DialogTitle>Start New Session</DialogTitle>
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
            >
              {createRoomMutation.isPending ? 'Creating...' : 'Start Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
