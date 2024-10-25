import { Card } from './deck'

export interface IPlayer {
  playerId: string
  nickname: string
  image: string
  score: number[]
  cards: Card[] | undefined
  isHost: boolean
  movesLeft: number
}
