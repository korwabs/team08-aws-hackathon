import { useState } from 'react'
import MeetingRoom from './pages/Meeting/MeetingRoom'
import Login from './components/Login'
import { useAuth } from './hooks/useAuth'

function App() {
  const [currentMeetingId] = useState('meeting-' + Date.now())
  const { isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <Login onLogin={login} />
  }

  return (
    <div className="App">
      <button onClick={logout} style={{ position: 'absolute', top: 10, right: 10 }}>
        로그아웃
      </button>
      <MeetingRoom meetingId={currentMeetingId} />
    </div>
  )
}

export default App
