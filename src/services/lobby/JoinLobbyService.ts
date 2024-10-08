import { WebSocket } from 'ws'
import { prisma } from '../../database/prisma-client'
import { JoinLobbyRequest, LobbyConnections } from '../../models/lobby'
import { joinLobbySchema } from '../../schemas/lobbySchema'
import { GetLobbyByIdService } from './GetLobbyByIdService'

export class JoinLobbyService {
  async execute(params: JoinLobbyRequest, lobbyConnections: LobbyConnections) {
    const parseData = joinLobbySchema.parse(params)
    const getLobby = new GetLobbyByIdService()
    const { playerId, image, nickname, lobbyId } = parseData

    const currLobby = await getLobby.execute(lobbyId)

    if (!currLobby) {
      throw new Error('We could not find this lobby!')
    }

    if (currLobby.currentPlayers >= currLobby.maxPlayers) {
      throw new Error('Lobby is already full!')
    }

    const createPlayer = { id: playerId, nickname, lobbyId, image }
    await prisma.player.create({ data: createPlayer })

    const response = await prisma.lobby.update({
      where: { id: lobbyId },
      data: {
        currentPlayers: { increment: 1 },
      },
      include: { players: true },
    })

    const playerJoinedMessage = JSON.stringify({
      type: 'playerJoined',
      player: { nickname, playerId, image, lobbyId },
    })

    const notifyPlayers = new Promise<void>((resolve) => {
      if (lobbyConnections[lobbyId]) {
        lobbyConnections[lobbyId].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(playerJoinedMessage)
          }
        })
        resolve()
      } else {
        resolve()
      }
    })

    await notifyPlayers

    const mappedPlayers = response.players.map((el) => ({
      ...el,
      isHost: el.id === response.host,
    }))

    return { ...response, players: mappedPlayers }
  }
}
