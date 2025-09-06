import { useState, useCallback, useEffect } from 'react'
import { useSocket } from './useSocket'

export interface HtmlDemoProgress {
  step: 'summary' | 'fastapi' | 'upload'
  message: string
}

export interface HtmlDemoResult {
  success: true
  message: string
  prdFile: string
  htmlFile: string
}

export interface HtmlDemoError {
  success: false
  error: string
}

export interface HtmlDemoState {
  isGenerating: boolean
  progress: HtmlDemoProgress | null
  result: HtmlDemoResult | null
  error: HtmlDemoError | null
}

export const useHtmlDemo = (roomId?: string, userId?: string) => {
  const [state, setState] = useState<HtmlDemoState>({
    isGenerating: false,
    progress: null,
    result: null,
    error: null
  })

  const { 
    generateHtmlDemo, 
    onHtmlDemoProgress, 
    onHtmlDemoComplete, 
    onHtmlDemoError 
  } = useSocket({ roomId, userId })

  // Progress handler
  const handleProgress = useCallback((progress: HtmlDemoProgress) => {
    setState(prev => ({
      ...prev,
      progress,
      error: null
    }))
  }, [])

  // Complete handler
  const handleComplete = useCallback((result: HtmlDemoResult) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: null,
      result,
      error: null
    }))
  }, [])

  // Error handler
  const handleError = useCallback((error: HtmlDemoError) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: null,
      result: null,
      error
    }))
  }, [])

  // Set up event listeners
  useEffect(() => {
    const unsubscribeProgress = onHtmlDemoProgress(handleProgress)
    const unsubscribeComplete = onHtmlDemoComplete(handleComplete)
    const unsubscribeError = onHtmlDemoError(handleError)

    return () => {
      unsubscribeProgress()
      unsubscribeComplete()
      unsubscribeError()
    }
  }, [onHtmlDemoProgress, onHtmlDemoComplete, onHtmlDemoError, handleProgress, handleComplete, handleError])

  // Start generation
  const startGeneration = useCallback((options?: { imageUrl?: string; prdUrl?: string; htmlUrl?: string }) => {
    if (!roomId || !userId) {
      console.error('Room ID and User ID are required for HTML demo generation')
      return
    }

    setState({
      isGenerating: true,
      progress: null,
      result: null,
      error: null
    })

    generateHtmlDemo(options)
  }, [roomId, userId, generateHtmlDemo])

  // Reset state
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: null,
      result: null,
      error: null
    })
  }, [])

  // Get progress percentage
  const getProgressPercentage = useCallback(() => {
    if (!state.progress) return 0
    
    const progressMap = {
      'summary': 33,
      'fastapi': 66,
      'upload': 90
    }
    
    return progressMap[state.progress.step] || 0
  }, [state.progress])

  // Get progress message
  const getProgressMessage = useCallback(() => {
    if (!state.progress) return ''
    
    const messageMap = {
      'summary': '채팅 요약 생성 중...',
      'fastapi': 'AI가 PRD와 HTML 생성 중...',
      'upload': '파일 업로드 중...'
    }
    
    return state.progress.message || messageMap[state.progress.step] || ''
  }, [state.progress])

  return {
    ...state,
    startGeneration,
    reset,
    getProgressPercentage,
    getProgressMessage
  }
}
