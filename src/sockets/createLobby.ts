import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'
import { genRandomKey } from '../utils/genRandomKey'
import { LobbyStatus } from '../utils/LobbyStatus'

interface ICreateLobbyRequest {
  playerId: string
  nickname: string
  image: string
}

export const createLobby = (socket: Socket, lobbies: Map<string, ILobby>) => {
  socket.on('create-lobby', (payload: ICreateLobbyRequest) => {
    const lobbyId = genRandomKey()

    const player = { ...payload, isHost: true }

    lobbies.set(lobbyId, {
      id: lobbyId,
      host: payload.playerId,
      currentPlayers: 1,
      maxPlayers: 6,
      players: [player],
      status: LobbyStatus.WAITING,
      rounds: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    socket.emit('lobby-created', lobbies.get(lobbyId))
  })
}
