import { useState } from 'react'

export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false)

  const shareSession = async (sessionId: string) => {
    setIsSharing(true)
    
    const shareUrl = `${window.location.origin}/session/${sessionId}`
    const shareData = {
      title: 'DeepVibe Session',
      text: 'Join my DeepVibe voice-to-demo session!',
      url: shareUrl,
    }

    try {
      // Check if Web Share API is supported (mobile)
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share(shareData)
      } else {
        // Desktop: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        
        // Show toast notification
        const toast = document.createElement('div')
        toast.textContent = 'Session URL copied to clipboard!'
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity'
        document.body.appendChild(toast)
        
        setTimeout(() => {
          toast.style.opacity = '0'
          setTimeout(() => document.body.removeChild(toast), 300)
        }, 2000)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Session URL copied to clipboard!')
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
        alert(`Share this URL: ${shareUrl}`)
      }
    } finally {
      setIsSharing(false)
    }
  }

  return { shareSession, isSharing }
}
