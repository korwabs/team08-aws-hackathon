import { useState } from 'react'
import MeetingRoom from './pages/Meeting/MeetingRoom'

function App() {
  const [currentMeetingId] = useState('meeting-' + Date.now())

  return (
    <div className="App">
      <MeetingRoom meetingId={currentMeetingId} />
    </div>
  )
}

export default App
