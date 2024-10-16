import { Card, IDeck } from './deck'
import { IPlayer } from './player'

export interface ILobby {
  id: string
  host: string
  status: string
  maxPlayers: number
  currentPlayers: number
  players: IPlayer[]
  rounds: number
  deck: IDeck | undefined
  discardPile: Card[]
  currentTurn: string | undefined
  isFirstTurn: boolean
  isLastTurn: boolean
  playerStartedLastTurn: string | undefined
  createdAt: Date
  updatedAt: Date
}
