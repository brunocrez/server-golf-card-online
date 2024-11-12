import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'
import { genRandomKey } from '../utils/genRandomKey'
import { LobbyStatus } from '../utils/LobbyStatus'
import { IPlayer } from '../models/player'
import {
  CURRENT_PLAYERS,
  FIRST_TURN_MOVES_COUNT,
  MAX_PLAYERS,
} from '../utils/game'
import { createPlayer } from '../utils/lobby'

interface ICreateLobbyRequest {
  playerId: string
  nickname: string
  image: string
}

interface IJoinLobbyRequest {
  playerId: string
  nickname: string
  image: string
  lobbyId: string
}

export const lobbyHandler = (socket: Socket, lobbies: Map<string, ILobby>) => {
  const createLobby = () => {
    socket.on('create-lobby', (payload: ICreateLobbyRequest) => {
      const lobbyId = genRandomKey()

      const player = createPlayer(payload, true)

      lobbies.set(lobbyId, {
        id: lobbyId,
        host: payload.playerId,
        currentPlayers: CURRENT_PLAYERS,
        maxPlayers: MAX_PLAYERS,
        players: [player],
        status: LobbyStatus.WAITING,
        rounds: 2,
        currentRound: 1,
        scoreBoard: undefined,
        deck: undefined,
        discardPile: [],
        currentTurn: payload.playerId,
        playerStartedLastTurn: undefined,
      })

      socket.join(lobbyId)
      socket.emit('lobby-created', lobbies.get(lobbyId))
    })
  }

  const joinLobby = () => {
    socket.on('join-lobby', (payload: IJoinLobbyRequest) => {
      const lobby = lobbies.get(payload.lobbyId)

      if (!lobby) {
        // não foi possível encontrar o lobby
        return
      }

      if (lobby.currentPlayers >= lobby.maxPlayers) {
        socket.emit('full-lobby', {
          message: 'desculpe, mas a sala já está cheia!',
          lobby,
        })
        return
      }

      const player = createPlayer(payload, false)
      const updatedPlayers = [...lobby.players, player]
      const updatedLobby = {
        ...lobby,
        players: updatedPlayers,
        currentPlayers: lobby.currentPlayers + 1,
      }

      lobbies.set(payload.lobbyId, updatedLobby)
      socket.join(payload.lobbyId)
      socket.emit('joined-lobby', updatedLobby)
      socket.broadcast.to(payload.lobbyId).emit('updated-lobby', updatedLobby)
    })
  }

  const getLobby = () => {
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

  const leaveLobby = () => {
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

  return { createLobby, joinLobby, getLobby, leaveLobby }
}
