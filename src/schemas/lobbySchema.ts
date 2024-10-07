import { z } from 'zod'

export const createLobbySchema = z.object({
  nickname: z.string().min(3).max(12),
  image: z.string().min(1),
  playerId: z.string().uuid(),
})

export const joinLobbySchema = z.object({
  nickname: z.string().min(3).max(12),
  image: z.string().min(1),
  playerId: z.string().uuid(),
  lobbyId: z.string().length(12),
})
