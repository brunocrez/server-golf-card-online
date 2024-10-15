import { Socket } from 'socket.io'
import { ILobby } from '../models/lobby'
import {
  CARDS_PER_PLAYER,
  distribuiteCards,
  flipPlayerCard,
  flipRemainingCards,
  hasMovesLeft,
  isFirstTurn,
  isLastTurn,
  nextTurn,
  startLastTurn,
  updatePlayerMoves,
} from '../utils/game'
import { createNewDeck, drawCard } from '../services/deck-service'
import { LobbyStatus } from '../utils/LobbyStatus'

export const gameHandler = (socket: Socket, lobbies: Map<string, ILobby>) => {
  const startGame = () => {
    socket.on('start-game', async (lobbyId: string) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        socket.emit('error-start-game', {
          message:
            'não foi possível começar o jogo, tente novamente mais tarde!',
        })
        return
      }

      const DRAW_COUNT = lobby.currentPlayers * CARDS_PER_PLAYER + 1

      try {
        const deck = await createNewDeck()
        const { cards, remaining } = await drawCard(deck.deck_id, DRAW_COUNT)

        const playersWithCards = distribuiteCards(lobby.players, cards)

        const updateGameState: ILobby = {
          ...lobby,
          players: playersWithCards,
          deck: { ...deck, remaining },
          isFirstTurn: true,
          discardPile: [cards[cards.length - 1]],
          status: LobbyStatus.IN_PROGRESS,
          currentTurn: lobby.host,
        }

        lobbies.set(lobby.id, updateGameState)
        socket.emit('game-started', updateGameState)
        socket.broadcast.to(lobby.id).emit('game-started', updateGameState)
      } catch (error) {
        console.error(error)
        socket.emit('error-start-game', {
          message:
            'não foi possível começar o jogo, tente novamente mais tarde!',
        })
      }
    })
  }

  const flipCard = () => {
    socket.on(
      'flip-card',
      (payload: { card: string; playerId: string; lobbyId: string }) => {
        const { card, playerId, lobbyId } = payload
        const lobby = lobbies.get(lobbyId)

        if (!lobby) {
          // algo deu errado!
          return
        }

        let updateGameState: ILobby = {} as ILobby
        const { id, players, playerStartedLastTurn } = lobby

        const updatedPlayers = flipPlayerCard(players, playerId, card)

        updateGameState = {
          ...lobby,
          players: updatedPlayers,
        }

        lobbies.set(id, updateGameState)

        if (startLastTurn(lobby, playerId)) {
          updateGameState = {
            ...lobby,
            playerStartedLastTurn: playerId,
          }

          lobbies.set(id, updateGameState)
        }

        if (isLastTurn(players)) {
          // revela cartas restantes
          const updatePlayer = flipRemainingCards(updatedPlayers, playerId)

          // passa o turno
          const nextTurnIndex = nextTurn(lobby, playerId)

          if (players[nextTurnIndex].playerId === playerStartedLastTurn) {
            // chegou na pessoa que virou a última carta
            // chamar função que finaliza o game endGame()

            updateGameState = {
              ...lobby,
              players: updatePlayer,
            }

            lobbies.set(lobby.id, updateGameState)
            socket.emit('updated-game', updateGameState)
            socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)

            return
          }

          updateGameState = {
            ...lobby,
            players: updatePlayer,
            currentTurn: lobby.players[nextTurnIndex].playerId,
          }

          lobbies.set(lobby.id, updateGameState)
          socket.emit('updated-game', updateGameState)
          socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)
          return
        }

        if (isFirstTurn(lobby.players)) {
          const updatedPlayerMoves = updatePlayerMoves(updatedPlayers, playerId)
          updateGameState = {
            ...lobby,
            players: updatedPlayerMoves,
          }

          if (!hasMovesLeft(updatedPlayerMoves, playerId)) {
            const nextTurnIndex = nextTurn(lobby, playerId)
            updateGameState = {
              ...lobby,
              players: updatedPlayerMoves,
              currentTurn: lobby.players[nextTurnIndex].playerId,
            }

            lobbies.set(lobby.id, updateGameState)
            socket.emit('updated-game', updateGameState)
            socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)
            return
          }

          lobbies.set(lobby.id, updateGameState)
          socket.emit('updated-game', updateGameState)
          socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)
          return
        }

        const nextTurnIndex = nextTurn(lobby, playerId)

        updateGameState = {
          ...lobby,
          players: updatedPlayers,
          currentTurn: lobby.players[nextTurnIndex].playerId,
        }

        lobbies.set(lobby.id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)

        return
      },
    )
  }

  return { startGame, flipCard }
}