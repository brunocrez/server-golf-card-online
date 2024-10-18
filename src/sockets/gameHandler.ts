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
  updateDiscardPile,
  updatePlayerBoard,
  updatePlayerMoves,
} from '../utils/game'
import { createNewDeck, drawCard } from '../services/deck-service'
import { LobbyStatus } from '../utils/LobbyStatus'
import { Card } from '../models/deck'
import { IPlayer } from '../models/player'

interface IFlipCardRequest {
  playerId: string
  card: string
  lobbyId: string
}

interface IDrawFromPileRequest {
  playerId: string
  drawnCard: Card
  cardToReplace: Card
  lobbyId: string
}

interface IDiscardDrawnCard {
  lobbyId: string
  playerId: string
  card: Card
}

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
    socket.on('flip-card', (payload: IFlipCardRequest) => {
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
    })
  }

  const replaceCard = () => {
    socket.on('replace-card', (payload: IDrawFromPileRequest) => {
      const { cardToReplace, drawnCard, lobbyId, playerId } = payload

      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        // algo deu errado!
        return
      }

      let updateGameState: ILobby = {} as ILobby
      const { id, players, discardPile, playerStartedLastTurn } = lobby

      const updatedPlayers = updatePlayerBoard(
        players,
        playerId,
        drawnCard,
        cardToReplace,
      )

      const updatedDiscardPile = updateDiscardPile(
        discardPile,
        drawnCard,
        cardToReplace,
      )

      updateGameState = {
        ...lobby,
        players: updatedPlayers,
        discardPile: updatedDiscardPile,
      }

      lobbies.set(lobbyId, updateGameState)

      if (startLastTurn(lobby, playerId)) {
        updateGameState = {
          ...lobby,
          playerStartedLastTurn: playerId,
          discardPile: updatedDiscardPile,
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
            discardPile: updatedDiscardPile,
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
          discardPile: updatedDiscardPile,
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
          discardPile: updatedDiscardPile,
        }

        if (!hasMovesLeft(updatedPlayerMoves, playerId)) {
          const nextTurnIndex = nextTurn(lobby, playerId)
          updateGameState = {
            ...lobby,
            players: updatedPlayerMoves,
            currentTurn: lobby.players[nextTurnIndex].playerId,
            discardPile: updatedDiscardPile,
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
        discardPile: updatedDiscardPile,
      }

      lobbies.set(lobby.id, updateGameState)
      socket.emit('updated-game', updateGameState)
      socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)

      return
    })
  }

  const drawCardFromDeck = () => {
    socket.on('draw-card-from-deck', async (lobbyId: string, cb) => {
      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        // algo deu errado!
        return
      }

      let updateGameState: ILobby = {} as ILobby
      const { id } = lobby

      try {
        const { cards, remaining, deck_id } = await drawCard(
          lobby.deck?.deck_id!,
          1,
        )
        // socket.emit('drawn-card', cards[0])

        updateGameState = {
          ...lobby,
          deck: { deck_id, cards: [], remaining },
        }

        lobbies.set(id, updateGameState)

        cb({ success: true, card: cards[0] })
      } catch (error) {
        console.error(error)
        cb({ success: false, message: 'não foi possível comprar a carta!' })
      }
    })
  }

  const discardDrawnCard = () => {
    socket.on('discard-card', (payload: IDiscardDrawnCard) => {
      const { card, lobbyId, playerId } = payload
      const lobby = lobbies.get(lobbyId)

      if (!lobby) {
        // algo deu errado!
        return
      }

      let updateGameState: ILobby = {} as ILobby
      const { id, discardPile, players, playerStartedLastTurn } = lobby

      updateGameState = {
        ...lobby,
        discardPile: [...discardPile, card],
      }

      lobbies.set(id, updateGameState)

      if (startLastTurn(lobby, playerId)) {
        updateGameState = {
          ...lobby,
          playerStartedLastTurn: playerId,
          discardPile: [...discardPile, card],
        }

        lobbies.set(id, updateGameState)
      }

      if (isLastTurn(players)) {
        // revela cartas restantes
        const updatePlayer = flipRemainingCards(players, playerId)

        // passa o turno
        const nextTurnIndex = nextTurn(lobby, playerId)

        if (players[nextTurnIndex].playerId === playerStartedLastTurn) {
          // chegou na pessoa que virou a última carta
          // chamar função que finaliza o game endGame()

          updateGameState = {
            ...lobby,
            players: updatePlayer,
            discardPile: [...discardPile, card],
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
          discardPile: [...discardPile, card],
        }

        lobbies.set(lobby.id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)
        return
      }

      if (isFirstTurn(lobby.players)) {
        const updatedPlayerMoves = updatePlayerMoves(players, playerId)

        updateGameState = {
          ...lobby,
          players: updatedPlayerMoves,
          discardPile: [...discardPile, card],
        }

        if (!hasMovesLeft(updatedPlayerMoves, playerId)) {
          const nextTurnIndex = nextTurn(lobby, playerId)
          updateGameState = {
            ...lobby,
            players: updatedPlayerMoves,
            currentTurn: lobby.players[nextTurnIndex].playerId,
            discardPile: [...discardPile, card],
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
        currentTurn: lobby.players[nextTurnIndex].playerId,
        discardPile: [...discardPile, card],
      }

      lobbies.set(lobby.id, updateGameState)
      socket.emit('updated-game', updateGameState)
      socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)

      return
    })
  }

  return {
    startGame,
    flipCard,
    replaceCard,
    drawCardFromDeck,
    discardDrawnCard,
  }
}
