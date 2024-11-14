import { Socket } from 'socket.io'
import { ILobby, IScoreBoard } from '../models/lobby'
import {
  CARDS_PER_PLAYER,
  cardScore,
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
import { createNewDeck, drawCard, shuffleDeck } from '../services/deck-service'
import { LobbyStatus } from '../utils/LobbyStatus'
import { Card, IDeck } from '../models/deck'

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
        const extraDrawnCard = cards[cards.length - 1]
        const discardCard = {
          ...extraDrawnCard,
          score: cardScore(extraDrawnCard),
        }

        const updateGameState: ILobby = {
          ...lobby,
          players: playersWithCards,
          deck: { ...deck, remaining },
          discardPile: [discardCard],
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

      if (startLastTurn(updateGameState, playerId)) {
        updateGameState = {
          ...lobby,
          playerStartedLastTurn: playerId,
        }
      }

      if (isLastTurn(players)) {
        // revela cartas restantes
        const updatePlayer = flipRemainingCards(updatedPlayers, playerId)

        // passa o turno
        const nextTurnIndex = nextTurn(lobby, playerId)

        if (players[nextTurnIndex].playerId === playerStartedLastTurn) {
          // chegou na pessoa que virou a última carta
          // chamar função que finaliza o game endGame()
          socket.emit('finish-round')
          socket.broadcast.to(id).emit('finish-round')

          setTimeout(() => {
            endGame(lobby)
          }, 5000)
        }

        updateGameState = {
          ...lobby,
          players: updatePlayer,
          currentTurn: lobby.players[nextTurnIndex].playerId,
        }

        lobbies.set(id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(id).emit('updated-game', updateGameState)
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

          lobbies.set(id, updateGameState)
          socket.emit('updated-game', updateGameState)
          socket.broadcast.to(id).emit('updated-game', updateGameState)
          return
        }

        lobbies.set(id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(id).emit('updated-game', updateGameState)
        return
      }

      const nextTurnIndex = nextTurn(lobby, playerId)

      updateGameState = {
        ...updateGameState,
        players: updatedPlayers,
        currentTurn: lobby.players[nextTurnIndex].playerId,
      }

      lobbies.set(id, updateGameState)
      socket.emit('updated-game', updateGameState)
      socket.broadcast.to(id).emit('updated-game', updateGameState)
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

      if (startLastTurn(updateGameState, playerId)) {
        updateGameState = {
          ...lobby,
          playerStartedLastTurn: playerId,
          discardPile: updatedDiscardPile,
        }
      }

      if (isLastTurn(players)) {
        // revela cartas restantes
        const updatePlayer = flipRemainingCards(updatedPlayers, playerId)

        // passa o turno
        const nextTurnIndex = nextTurn(lobby, playerId)

        if (players[nextTurnIndex].playerId === playerStartedLastTurn) {
          // chegou na pessoa que virou a última carta
          // chamar função que finaliza o game endGame()
          socket.emit('finish-round')
          socket.broadcast.to(id).emit('finish-round')

          setTimeout(() => {
            endGame(lobby)
          }, 5000)
        }

        updateGameState = {
          ...lobby,
          players: updatePlayer,
          currentTurn: lobby.players[nextTurnIndex].playerId,
          discardPile: updatedDiscardPile,
        }

        lobbies.set(id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(id).emit('updated-game', updateGameState)
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

          lobbies.set(id, updateGameState)
          socket.emit('updated-game', updateGameState)
          socket.broadcast.to(id).emit('updated-game', updateGameState)
          return
        }

        lobbies.set(id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(id).emit('updated-game', updateGameState)
        return
      }

      const nextTurnIndex = nextTurn(lobby, playerId)

      updateGameState = {
        ...updateGameState,
        players: updatedPlayers,
        currentTurn: lobby.players[nextTurnIndex].playerId,
        discardPile: updatedDiscardPile,
      }

      lobbies.set(id, updateGameState)
      socket.emit('updated-game', updateGameState)
      socket.broadcast.to(id).emit('updated-game', updateGameState)
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

        updateGameState = {
          ...lobby,
          deck: { deck_id, cards: [], remaining },
        }

        lobbies.set(id, updateGameState)
        const mappedCard = { ...cards[0], score: cardScore(cards[0]) }

        cb({ success: true, card: mappedCard })
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

      if (startLastTurn(updateGameState, playerId)) {
        updateGameState = {
          ...lobby,
          playerStartedLastTurn: playerId,
          discardPile: [...discardPile, card],
        }
      }

      if (isLastTurn(players)) {
        // revela cartas restantes
        const updatePlayer = flipRemainingCards(players, playerId)

        // passa o turno
        const nextTurnIndex = nextTurn(lobby, playerId)

        if (players[nextTurnIndex].playerId === playerStartedLastTurn) {
          // chegou na pessoa que virou a última carta
          // chamar função que finaliza o game endGame()

          socket.emit('finish-round')
          socket.broadcast.to(id).emit('finish-round')

          setTimeout(() => {
            endGame(lobby)
          }, 5000)
        }

        updateGameState = {
          ...lobby,
          players: updatePlayer,
          currentTurn: lobby.players[nextTurnIndex].playerId,
          discardPile: [...discardPile, card],
        }

        lobbies.set(id, updateGameState)
        socket.emit('updated-game', updateGameState)
        socket.broadcast.to(id).emit('updated-game', updateGameState)
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
        ...updateGameState,
        currentTurn: lobby.players[nextTurnIndex].playerId,
        discardPile: [...discardPile, card],
      }

      lobbies.set(lobby.id, updateGameState)
      socket.emit('updated-game', updateGameState)
      socket.broadcast.to(lobby.id).emit('updated-game', updateGameState)
    })
  }

  const endGame = async (lobby: ILobby) => {
    let updateGameState: ILobby = {} as ILobby
    let deck: IDeck = {} as IDeck
    let scoreBoard: IScoreBoard[] = []

    // create current score board array
    const currScoreBoard = lobby.players.map((player) => {
      const { playerId, score, nickname } = player
      return {
        playerId,
        score: score.reduce((acc, curr) => acc + curr, 0),
        nickname,
      }
    })

    // add current scoreBoard to existing one
    if (lobby.scoreBoard) {
      scoreBoard = lobby.scoreBoard
        .map((lobbyScore) => {
          const currScore = currScoreBoard.find(
            (el) => el.playerId === lobbyScore.playerId,
          )
          return { ...lobbyScore, score: lobbyScore.score + currScore?.score! }
        })
        .sort((a, b) => a.score - b.score)
    } else {
      scoreBoard = currScoreBoard.sort((a, b) => a.score - b.score)
    }

    // reset players score
    const players = lobby.players.map((player) => ({
      ...player,
      score: [0, 0, 0],
    }))

    // reshuffle the deck
    try {
      deck = await shuffleDeck(lobby.deck?.deck_id!)
    } catch (error) {
      console.error(error)
      socket.emit('error-end-game', {
        message:
          'não foi possível finalizar o jogo, tente novamente mais tarde!',
      })
    }

    updateGameState = {
      ...lobby,
      players,
      scoreBoard,
      deck,
      currentRound: lobby.currentRound + 1,
    }

    lobbies.set(lobby.id, updateGameState)

    // verify if it's the last round
    if (lobby.currentRound + 1 > lobby.rounds) {
      socket.emit('end-game', updateGameState)
      socket.broadcast.to(lobby.id).emit('end-game', updateGameState)
      return
    }

    proceedToNextRound(lobby.id)
  }

  const proceedToNextRound = async (lobbyId: string) => {
    const lobby = lobbies.get(lobbyId)

    if (!lobby) {
      // algo deu errado!
      return
    }

    const { deck } = lobby
    const DRAW_COUNT = lobby.currentPlayers * CARDS_PER_PLAYER + 1

    const { cards, remaining } = await drawCard(deck?.deck_id!, DRAW_COUNT)

    const playersWithCards = distribuiteCards(lobby.players, cards)
    const extraDrawnCard = cards[cards.length - 1]
    const discardCard = {
      ...extraDrawnCard,
      score: cardScore(extraDrawnCard),
    }

    const updateGameState: ILobby = {
      ...lobby,
      players: playersWithCards,
      deck: { ...deck!, remaining },
      discardPile: [discardCard],
      status: LobbyStatus.IN_PROGRESS,
    }

    lobbies.set(lobby.id, updateGameState)
    socket.emit('proceed-to-next-round', updateGameState)
    socket.broadcast.to(lobby.id).emit('proceed-to-next-round', updateGameState)
  }

  return {
    startGame,
    endGame,
    proceedToNextRound,
    flipCard,
    replaceCard,
    drawCardFromDeck,
    discardDrawnCard,
  }
}
