import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'
import { genRandomKey } from '../utils/genRandomKey'
import { LobbyStatus } from '../utils/LobbyStatus'

interface ICreateLobbyRequest {
  playerId: string
  nickname: string
  image: string
}

const MAX_PLAYERS = 6
const CURRENT_PLAYERS = 1

export const createLobby = (socket: Socket, lobbies: Map<string, ILobby>) => {
  socket.on('create-lobby', (payload: ICreateLobbyRequest) => {
    const lobbyId = genRandomKey()

    const player = { ...payload, isHost: true }

    lobbies.set(lobbyId, {
      id: lobbyId,
      host: payload.playerId,
      currentPlayers: CURRENT_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      players: [player],
      status: LobbyStatus.WAITING,
      rounds: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    socket.join(lobbyId)
    socket.emit('lobby-created', lobbies.get(lobbyId))
  })
}
