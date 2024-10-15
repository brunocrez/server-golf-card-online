import { Card } from '../models/deck'
import { ILobby } from '../models/lobby'
import { IPlayer } from '../models/player'

export const FIRST_TURN_MOVES_COUNT = 3
export const CARDS_PER_PLAYER = 6
export const MAX_PLAYERS = 6
export const CURRENT_PLAYERS = 1

export const distribuiteCards = (
  players: IPlayer[],
  cards: Card[],
): IPlayer[] => {
  let cardIndex = 0

  return players.map((player) => {
    const playerCards = cards
      .slice(cardIndex, cardIndex + 6)
      .map((card) => ({ ...card, faceUp: false }))
    cardIndex += 6

    return { ...player, cards: playerCards, movesLeft: FIRST_TURN_MOVES_COUNT }
  })
}

export const isFirstTurn = (players: IPlayer[]) => {
  return players.some((player) => player.movesLeft > 0)
}

export const isLastTurn = (players: IPlayer[]) => {
  return players.some((player) =>
    player.cards?.every((card) => card.faceUp === true),
  )
}

export const flipPlayerCard = (
  players: IPlayer[],
  playerId: string,
  cardCode: string,
) => {
  return players.map((player) => {
    if (player.playerId === playerId) {
      return {
        ...player,
        cards: player.cards?.map((card) => {
          return card.code === cardCode ? { ...card, faceUp: true } : card
        }),
      }
    }

    return player
  })
}

export const flipRemainingCards = (players: IPlayer[], playerId: string) => {
  return players.map((player) => {
    if (player.playerId === playerId) {
      return {
        ...player,
        cards: player.cards?.map((card) => ({ ...card, faceUp: true })),
      }
    }

    return player
  })
}

export const nextTurn = (lobby: ILobby, playerId: string) => {
  const currPlayerIndex = lobby.players.findIndex(
    (p) => p.playerId === playerId,
  )
  const nextPlayerIndex = currPlayerIndex + 1

  if (nextPlayerIndex > lobby.players.length - 1) {
    return 0
  }

  return nextPlayerIndex
}

export const startLastTurn = (lobby: ILobby, playerId: string) => {
  if (lobby.playerStartedLastTurn) {
    return false
  }

  const idx = lobby.players.findIndex((p) => p.playerId === playerId)
  return lobby.players[idx].cards?.every((card) => card.faceUp === true)
}

export const updatePlayerMoves = (players: IPlayer[], playerId: string) => {
  return players.map((player) => {
    if (player.playerId === playerId) {
      return { ...player, movesLeft: player.movesLeft - 1 }
    }
    return player
  })
}

export const hasMovesLeft = (players: IPlayer[], playerId: string) => {
  const currPlayerIndex = players.findIndex((p) => p.playerId === playerId)
  return players[currPlayerIndex].movesLeft > 0
}
