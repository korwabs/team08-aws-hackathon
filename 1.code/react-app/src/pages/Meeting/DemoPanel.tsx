import { useState, useRef } from 'react'

interface DemoPanelProps {
  meetingId: string
}

export default function DemoPanel({ meetingId: _ }: DemoPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // 실제로는 서버에서 받아올 HTML 파일 URL
  const demoHtmlUrl = '/mock-demo.html'

  const handleFullscreen = () => {
    if (!iframeRef.current) return
    
    if (!isFullscreen) {
      iframeRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Generated Demo</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Refresh
          </button>
          <button 
            onClick={handleFullscreen}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* 데모 표시 영역 */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <iframe 
          ref={iframeRef}
          src={demoHtmlUrl}
          className="w-full h-full border-0"
          title="Generated Demo"
          onLoad={() => {
            // fullscreen 상태 변화 감지
            document.addEventListener('fullscreenchange', () => {
              setIsFullscreen(!!document.fullscreenElement)
            })
          }}
        />
      </div>
    </div>
  )
}
