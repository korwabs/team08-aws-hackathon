import { useRef } from 'react'
import { Camera } from 'lucide-react'
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
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105 z-50 ${
          uploadImageMutation.isPending 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        }`}
        title="이미지 업로드"
      >
        {uploadImageMutation.isPending ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Camera className="w-8 h-8" />
        )}
      </button>
    </>
  )
}
