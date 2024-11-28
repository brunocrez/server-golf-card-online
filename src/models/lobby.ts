import { Card, IDeck } from './deck'
import { IPlayer } from './player'

export interface IScoreBoard {
  nickname: string
  score: number
  playerId: string
}

export interface ILobby {
  id: string
  host: string
  status: string
  maxPlayers: number
  currentPlayers: number
  players: IPlayer[]
  rounds: number
  currentRound: number
  scoreBoard: IScoreBoard[] | undefined
  deck: IDeck | undefined
  discardPile: Card[]
  currentTurn: string | undefined
  playerStartedLastTurn: string | undefined
  drawnCard: Card | undefined
}
