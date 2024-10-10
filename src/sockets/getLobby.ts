import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'

export const getLobby = (socket: Socket, lobbies: Map<string, ILobby>) => {
  socket.on('get-lobby', (lobbyId: string) => {
    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      socket.emit(
        'lobby-not-found',
        'não encontramos nenhuma sala com esse código!',
      )
      return
    }

    socket.emit('lobby-details', lobby)
  })
}
