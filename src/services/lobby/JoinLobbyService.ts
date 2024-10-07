import { ILobby, JoinLobbyRequest } from '../../models/lobby'
import { joinLobbySchema } from '../../schemas/lobbySchema'
import { CreatePlayerService } from '../player/CreatePlayerService'
import { GetLobbyByIdService } from './GetLobbyByIdService'
import { UpdateLobbyService } from './UpdateLobbyService'

export class JoinLobbyService {
  async execute(params: JoinLobbyRequest) {
    const parseData = joinLobbySchema.parse(params)
    const getLobby = new GetLobbyByIdService()
    const playerService = new CreatePlayerService()
    const updateLobbyService = new UpdateLobbyService()
    const { playerId, image, nickname, lobbyId } = parseData

    const currLobby = await getLobby.execute(lobbyId)

    if (!currLobby) {
      throw new Error('We could not find this lobby!')
    }

    if (currLobby.currentPlayers >= currLobby.maxPlayers) {
      throw new Error('Lobby is already full!')
    }

    await playerService.execute({ id: playerId, nickname, lobbyId, image })

    // update lobby
    const data: ILobby = {
      host: currLobby.host,
      id: currLobby.id,
      maxPlayers: currLobby.maxPlayers,
      rounds: currLobby.rounds,
      status: currLobby.status,
      currentPlayers: currLobby.currentPlayers + 1,
      createdAt: currLobby.createdAt,
      updatedAt: new Date(),
    }

    return await updateLobbyService.execute(data)
  }
}
