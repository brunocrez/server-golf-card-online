import { prisma } from '../../database/prisma-client'

export class GetLobbyByIdService {
  async execute(lobbyId: string) {
    return await prisma.lobby.findFirst({
      where: { id: lobbyId },
      include: { players: true },
    })
  }
}
