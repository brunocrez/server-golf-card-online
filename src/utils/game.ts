import { Card } from '../models/deck'
import { ILobby } from '../models/lobby'
import { IPlayer } from '../models/player'

export const FIRST_TURN_MOVES_COUNT = 3
export const CARDS_PER_PLAYER = 6
export const MAX_PLAYERS = 6
export const CURRENT_PLAYERS = 1
export const INITIAL_SCORE = [0, 0, 0]

const getPlayerScore = (playerId: string, players: IPlayer[]) => {
  const pairs = [
    [0, 3],
    [1, 4],
    [2, 5],
  ]

  return players.map((p) => {
    if (p.playerId === playerId) {
      const columnScores = pairs.map(([idx1, idx2]) => {
        const card1 = p.cards?.[idx1]
        const card2 = p.cards?.[idx2]

        const card1FaceUp = card1?.faceUp
        const card2FaceUp = card2?.faceUp

        // one of them is a joker
        if (
          (card1FaceUp && card1.value === 'JOKER') ||
          (card2FaceUp && card2.value === 'JOKER')
        ) {
          return 0
        }

        // they're equals, column score is 0
        if (card1FaceUp && card2FaceUp && card1.value === card2.value) {
          return 0
        }

        // only one of the pair is face up
        if (card1FaceUp && !card2FaceUp) {
          return card1.score
        }

        if (card2FaceUp && !card1FaceUp) {
          return card2.score
        }

        // both pairs are face up
        if (card1FaceUp && card2FaceUp) {
          return card1.score + card2.score
        }

        // none of them is face up
        return 0
      })

      return { ...p, score: columnScores }
    }

    return p
  })
}

export const cardScore = (card: Card) => {
  switch (card.value) {
    case 'ACE':
      return 1
    case 'JACK':
      return 10
    case 'QUEEN':
      return 10
    case 'KING':
      return 0
    case '2':
      return -2
    case 'JOKER':
      return -1
    default:
      return Number(card.value)
  }
}

export const distribuiteCards = (
  players: IPlayer[],
  cards: Card[],
): IPlayer[] => {
  let cardIndex = 0

  return players.map((player) => {
    const playerCards = cards
      .slice(cardIndex, cardIndex + 6)
      .map((card) => ({ ...card, faceUp: false, score: cardScore(card) }))

    cardIndex += 6

    return {
      ...player,
      cards: playerCards,
      movesLeft: FIRST_TURN_MOVES_COUNT,
      score: INITIAL_SCORE,
    }
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
  const updatedPlayers = players.map((player) => {
    if (player.playerId === playerId) {
      const updatedCards = player.cards?.map((card) => {
        return card.code === cardCode ? { ...card, faceUp: true } : card
      })

      return {
        ...player,
        cards: updatedCards,
      }
    }

    return player
  })

  return getPlayerScore(playerId, updatedPlayers)
}

export const flipRemainingCards = (players: IPlayer[], playerId: string) => {
  const updatedPlayers = players.map((player) => {
    if (player.playerId === playerId) {
      return {
        ...player,
        cards: player.cards?.map((card) => ({ ...card, faceUp: true })),
      }
    }

    return player
  })

  return getPlayerScore(playerId, updatedPlayers)
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

  if (currPlayerIndex === -1) {
    return
  }

  return players[currPlayerIndex].movesLeft > 0
}

export const updatePlayerBoard = (
  players: IPlayer[],
  playerId: string,
  drawnCard: Card,
  cardToBeReplaced: Card,
) => {
  const player = players.find((p) => p.playerId === playerId)

  if (!player || !player.cards) {
    return players
  }

  const cardIndex = player.cards.findIndex(
    (card) => card.code === cardToBeReplaced.code,
  )

  if (cardIndex === -1) {
    return players
  }

  const updatedCards = [
    ...player.cards.slice(0, cardIndex),
    { ...drawnCard, faceUp: true },
    ...player.cards.slice(cardIndex + 1),
  ]

  const updatedPlayers = players.map((p) => {
    if (p.playerId === playerId) {
      return {
        ...p,
        cards: updatedCards,
      }
    }

    return p
  })

  return getPlayerScore(playerId, updatedPlayers)
}

export const updateDiscardPile = (
  pile: Card[],
  drawnCard: Card,
  cardToReplace: Card,
) => {
  const newPile = pile.filter((card) => card.code !== drawnCard.code)
  newPile.push(cardToReplace)
  return newPile
}
