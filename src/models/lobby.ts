import { IPlayer } from './player'

export interface ILobby {
  id: string
  host: string
  status: string
  maxPlayers: number
  currentPlayers: number
  players: IPlayer[]
  rounds: number
  createdAt: Date
  updatedAt: Date
}
