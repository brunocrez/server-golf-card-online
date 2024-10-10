import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'

export const leaveLobby = (socket: Socket, lobbies: Map<string, ILobby>) => {
  socket.on('leave-lobby', (payload: { lobbyId: string }) => {
    const { lobbyId } = payload

    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      return
    }

    const updatedPlayers = lobby.players.filter(
      (player) => player.playerId !== socket.id,
    )

    const updatedLobby = {
      ...lobby,
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
    }

    lobbies.set(lobbyId, updatedLobby)
    socket.leave(lobbyId)
    socket.broadcast.emit('updated-lobby', updatedLobby)
  })
}
