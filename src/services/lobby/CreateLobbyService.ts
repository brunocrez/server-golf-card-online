import { genRandomKey } from '../../utils/genRandomKey'
import { prisma } from '../../database/prisma-client'
import { RoomStatus } from '../../utils/roomStatus'
import { CreatePlayerService } from '../player/CreatePlayerService'
import { ICreateLobby } from '../../models/lobby'
import { createLobbySchema } from '../../schemas/lobbySchema'

const ROOM_LIMIT_PLAYERS = 6
const ROUNDS_LIMIT = 5
const CURRENT_PLAYERS = 1

export class CreateLobbyService {
  async execute(params: ICreateLobby) {
    const parsedParams = createLobbySchema.parse(params)
    const playerService = new CreatePlayerService()
    const lobbyId = genRandomKey()
    const { playerId, nickname, image } = parsedParams

    const data = {
      id: lobbyId,
      host: playerId,
      status: RoomStatus.WAITING,
      maxPlayers: ROOM_LIMIT_PLAYERS,
      currentPlayers: CURRENT_PLAYERS,
      rounds: ROUNDS_LIMIT,
    }

    const response = await prisma.lobby.create({ data })

    await playerService.execute({ nickname, id: playerId, lobbyId, image })

    return {
      ...response,
      players: [{ id: playerId, nickname, image, isHost: true }],
    }
  }
}
