import { z } from 'zod'

export const createPlayerSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string().min(3).max(12),
  image: z.string().min(1),
  lobbyId: z.string().length(12),
})
