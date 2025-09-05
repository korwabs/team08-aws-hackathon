import { useState, useRef } from 'react'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  meetingId: string
}

export default function ImageUploadModal({ isOpen, onClose, meetingId }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleGenerateDemo = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    
    try {
      // TODO: AWS S3 업로드 및 데모 생성 API 호출
      console.log('Uploading file:', selectedFile.name)
      console.log('Meeting ID:', meetingId)
      
      // 임시 지연
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 성공 후 모달 닫기
      onClose()
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload Mockup Image</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 업로드 영역 */}
        {!previewUrl ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mb-2">Drag & drop your mockup image here</p>
            <p className="text-sm text-gray-400 mb-4">or click to browse</p>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md">
              Choose File
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border"
            />
            <p className="text-sm text-gray-600 mt-2">{selectedFile?.name}</p>
            <button
              onClick={() => {
                URL.revokeObjectURL(previewUrl)
                setPreviewUrl(null)
                setSelectedFile(null)
              }}
              className="text-sm text-red-500 hover:text-red-700 mt-1"
            >
              Remove image
            </button>
          </div>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerateDemo}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Generating...' : 'Generate Demo'}
          </button>
        </div>
      </div>
    </div>
  )
}
