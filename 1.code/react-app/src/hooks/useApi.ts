import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// Query Keys
export const queryKeys = {
  rooms: ['rooms'] as const,
  messages: (roomId: string) => ['messages', roomId] as const,
  htmlFiles: (roomId: string) => ['htmlFiles', roomId] as const,
  summary: (roomId: string) => ['summary', roomId] as const,
}

// Rooms
export const useRooms = () => {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: api.getRooms,
  })
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { name: string }) => api.createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms })
    },
  })
}

// Messages
export const useMessages = (roomId: string) => {
  return useQuery({
    queryKey: queryKeys.messages(roomId),
    queryFn: () => api.getMessages(roomId),
    enabled: !!roomId,
  })
}

// Upload
export const useUploadImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file, roomId, userId }: { file: File; roomId: string; userId: string }) =>
      api.uploadImage(file, roomId, userId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(roomId) })
    },
  })
}

export const useUploadHtml = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ file, roomId, userId }: { file: File; roomId: string; userId: string }) =>
      api.uploadHtml(file, roomId, userId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.htmlFiles(roomId) })
    },
  })
}

// HTML Files
export const useHtmlFiles = (roomId: string) => {
  return useQuery({
    queryKey: queryKeys.htmlFiles(roomId),
    queryFn: () => api.getHtmlFiles(roomId),
    enabled: !!roomId,
  })
}

// Summary
export const useSummary = (roomId: string) => {
  return useQuery({
    queryKey: queryKeys.summary(roomId),
    queryFn: () => api.getSummary(roomId),
    enabled: !!roomId,
  })
}
