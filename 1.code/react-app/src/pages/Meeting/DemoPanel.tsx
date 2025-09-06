import { useState, useRef, useEffect } from 'react'
import { Maximize, RefreshCw, Zap, ExternalLink, FileText, ChevronDown, Copy } from 'lucide-react'
import { useHtmlDemo } from '../../hooks/useHtmlDemo'
import { useHtmlFiles } from '../../hooks/useApi'
import { Button } from '../../components/ui'

interface DemoPanelProps {
  meetingId: string
}

interface HtmlFile {
  id: number
  version: number
  created_at: string
  s3_url: string
}

export default function DemoPanel({ meetingId }: DemoPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDemoUrl, setCurrentDemoUrl] = useState<string | null>(null)
  const [selectedHtmlId, setSelectedHtmlId] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // HTML 데모 생성 훅
  const userId = 'user-' + Date.now() // 임시 사용자 ID
  const { 
    isGenerating, 
    result, 
    error, 
    startGeneration, 
    reset,
    getProgressPercentage,
    getProgressMessage 
  } = useHtmlDemo(meetingId, userId)

  // HTML 파일 목록 조회
  const { data: htmlFiles, refetch: refetchHtmlFiles } = useHtmlFiles(meetingId)

  // 데모 생성 완료 시 HTML 목록 새로고침 및 최신 HTML 표시
  useEffect(() => {
    if (result?.htmlFile) {
      refetchHtmlFiles().then(({ data }) => {
        // HTML 목록에서 최신 HTML 가져오기 (첫 번째가 최신)
        if (data && data.length > 0) {
          const latestHtml = data[0]
          setSelectedHtmlId(latestHtml.id)
          setCurrentDemoUrl(latestHtml.s3_url)
        }
      })
    }
  }, [result, refetchHtmlFiles])

  // HTML 파일 목록이 업데이트되면 최신 파일을 자동 선택
  useEffect(() => {
    if (htmlFiles && htmlFiles.length > 0 && !selectedHtmlId) {
      const latestHtml = htmlFiles[0] // 첫 번째가 최신 (서버에서 정렬됨)
      setSelectedHtmlId(latestHtml.id)
      setCurrentDemoUrl(latestHtml.s3_url)
    }
  }, [htmlFiles, selectedHtmlId])

  const handleHtmlSelect = (htmlId: number) => {
    const selectedHtml = htmlFiles?.find((html: HtmlFile) => html.id === htmlId)
    if (selectedHtml) {
      setSelectedHtmlId(htmlId)
      setCurrentDemoUrl(selectedHtml.s3_url)
    }
  }

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
    if (iframeRef.current && currentDemoUrl) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const handleGenerateDemo = () => {
    startGeneration()
  }

  const handleReset = () => {
    reset()
    setCurrentDemoUrl(null)
    setSelectedHtmlId(null)
  }

  const handleCopyLink = async () => {
    if (currentDemoUrl) {
      try {
        await navigator.clipboard.writeText(currentDemoUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
      {/* 헤더 */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Generated Demo
          </h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered prototype generation</p>
        </div>
        
        <div className="flex gap-2 flex-wrap items-center">
          {/* HTML 버전 선택 */}
          {htmlFiles && htmlFiles.length > 0 && (
            <div className="relative">
              <select
                value={selectedHtmlId || ''}
                onChange={(e) => handleHtmlSelect(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Version</option>
                {htmlFiles.map((html: HtmlFile) => (
                  <option key={html.id} value={html.id}>
                    v{html.version} - {new Date(html.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {!isGenerating && !result && (
            <Button 
              onClick={handleGenerateDemo}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 text-sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Demo
            </Button>
          )}
          
          {(result || currentDemoUrl) && (
            <>
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className={`text-xs sm:text-sm ${copied ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
              
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              <Button 
                onClick={handleFullscreen}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Maximize className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
              
              <Button 
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 로딩 상태 */}
        {isGenerating && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* 진행률 바 */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Generating Demo...</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              
              {/* 진행 메시지 */}
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white animate-pulse" />
                </div>
                <p className="text-gray-700 font-medium">{getProgressMessage()}</p>
                <p className="text-sm text-gray-500 mt-2">
                  AI is analyzing your conversation and creating a prototype...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Generation Failed</h3>
              <p className="text-gray-600 mb-4">{error.error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleGenerateDemo} size="sm">
                  Try Again
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm">
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* HTML 표시 */}
        {currentDemoUrl && (
          <div className="h-full flex flex-col">
            {/* 결과 정보 바 (생성 완료 시에만) */}
            {result && (
              <div className="bg-green-50 border-b border-green-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-lg">✅</span>
                  <span className="font-medium text-sm">{result.message}</span>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={result.prdFile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="w-3 h-3" />
                    PRD
                  </a>
                  <a 
                    href={result.htmlFile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>
              </div>
            )}
            
            {/* iframe */}
            <div className="flex-1">
              <iframe 
                ref={iframeRef}
                src={currentDemoUrl}
                className="w-full h-full border-0"
                title="Generated Demo"
                onLoad={() => {
                  document.addEventListener('fullscreenchange', () => {
                    setIsFullscreen(!!document.fullscreenElement)
                  })
                }}
              />
            </div>
          </div>
        )}

        {/* 초기 상태 */}
        {!isGenerating && !result && !error && !currentDemoUrl && (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <Zap className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Ready to Generate</h3>
              <p className="text-gray-600 mb-6">
                Click "Generate Demo" to create an interactive prototype based on your conversation and uploaded images.
              </p>
              <Button 
                onClick={handleGenerateDemo}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3"
              >
                <Zap className="w-5 h-5 mr-2" />
                Generate Demo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
