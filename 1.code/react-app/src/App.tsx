import { useState, useEffect } from 'react'
import MeetingRoom from './pages/Meeting/MeetingRoom'
import Login from './components/Login'
import { useAuth } from './hooks/useAuth'

function App() {
  const [currentMeetingId] = useState('meeting-' + Date.now())
  const { isAuthenticated, login, logout } = useAuth()
  const [joinSessionId, setJoinSessionId] = useState<string | null>(null)

  useEffect(() => {
    // Check for join parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const joinId = urlParams.get('join')
    if (joinId) {
      setJoinSessionId(joinId)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (!isAuthenticated) {
    return <Login onLogin={login} />
  }

  return (
    <div className="App">
      <MeetingRoom 
        meetingId={joinSessionId || currentMeetingId} 
        onLogout={logout} 
        autoJoin={!!joinSessionId}
      />
    </div>
  )
}

export default App
