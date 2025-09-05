const API_BASE_URL = 'https://d2k05d66hwbq2e.cloudfront.net'

export const api = {
  // Rooms
  getRooms: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rooms`)
    if (!response.ok) throw new Error('Failed to fetch rooms')
    return response.json()
  },

  createRoom: async (data: { name: string; participants?: number }) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create room')
    return response.json()
  },

  // Messages
  getMessages: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/messages`)
    if (!response.ok) throw new Error('Failed to fetch messages')
    return response.json()
  },

  // Upload
  uploadImage: async (file: File, roomId: string, userId: string) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('roomId', roomId)
    formData.append('userId', userId)

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new Error('Failed to upload image')
    return response.json()
  },

  // HTML
  uploadHtml: async (file: File, roomId: string, userId: string) => {
    const formData = new FormData()
    formData.append('html', file)
    formData.append('userId', userId)

    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/html`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new Error('Failed to upload HTML')
  },

  getHtmlFiles: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/html`)
    if (!response.ok) throw new Error('Failed to fetch HTML files')
    return response.json()
  },

  // Summary
  getSummary: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/summary`)
    if (!response.ok) throw new Error('Failed to fetch summary')
    return response.json()
  }
}
