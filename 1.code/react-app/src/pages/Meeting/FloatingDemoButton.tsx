import { useRef } from 'react'
import { useUploadImage } from '../../hooks/useApi'

interface FloatingDemoButtonProps {
  meetingId: string
  userId: string
}

export default function FloatingDemoButton({ meetingId, userId }: FloatingDemoButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImageMutation = useUploadImage()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        await uploadImageMutation.mutateAsync({
          file,
          roomId: meetingId,
          userId
        })
      } catch (error) {
        console.error('Image upload failed:', error)
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={uploadImageMutation.isPending}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105 ${
          uploadImageMutation.isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {uploadImageMutation.isPending ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </>
  )
}
