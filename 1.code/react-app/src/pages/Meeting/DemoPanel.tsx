interface DemoPanelProps {
  meetingId: string
}

export default function DemoPanel({ meetingId: _ }: DemoPanelProps) {
  return (
    <div className="h-full flex flex-col p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Generated Demo</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
            Refresh
          </button>
          <button className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md">
            Fullscreen
          </button>
        </div>
      </div>

      {/* 데모 표시 영역 */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No demo generated yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload an image to generate your first demo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
