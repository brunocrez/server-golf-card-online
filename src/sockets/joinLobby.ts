import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'

interface IJoinLobbyRequest {
  playerId: string
  nickname: string
  image: string
  lobbyId: string
}

export const joinLobby = (socket: Socket, lobbies: Map<string, ILobby>) => {
  socket.on('join-lobby', (payload: IJoinLobbyRequest) => {
    const lobby = lobbies.get(payload.lobbyId)
    const { image, nickname, playerId } = payload

    if (!lobby) {
      return
    }

    if (lobby.currentPlayers >= lobby.maxPlayers) {
      socket.emit('lobby-full', 'lobby cheio')
    }

    const player = { nickname, image, playerId }
    const updatedPlayers = [...lobby.players, player]
    const updatedLobby = {
      ...lobby,
      players: updatedPlayers,
      currentPlayers: lobby.currentPlayers + 1,
    }

    lobbies.set(payload.lobbyId, updatedLobby)

    socket.join(payload.lobbyId)
    socket.emit('joined-lobby', updatedLobby)
    socket.broadcast.emit('updated-lobby', updatedLobby)
  })
}
