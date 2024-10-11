import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'

export const onDisconnect = (socket: Socket, lobbies: Map<string, ILobby>) => {
  console.log('Disconnecting: ', socket.id)
  for (const [lobbyId, lobby] of lobbies.entries()) {
    const playerIndex = lobby.players.findIndex(
      (player) => player.playerId === socket.id,
    )

    if (playerIndex !== -1) {
      const updatedPlayers = lobby.players.filter(
        (player) => player.playerId !== socket.id,
      )

      const updatedLobby = {
        ...lobby,
        players: updatedPlayers,
        currentPlayers: updatedPlayers.length,
      }

      socket.broadcast.to(lobbyId).emit('updated-lobby', updatedLobby)

      if (lobby.currentPlayers === 0) {
        lobbies.delete(lobbyId)
      }
    }
  }
}
