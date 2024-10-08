import { WebSocket } from 'ws'

export interface ILobby {
  id: string
  host: string
  status: string
  maxPlayers: number
  currentPlayers: number
  rounds: number
  createdAt: Date
  updatedAt: Date
}

export interface ICreateLobby {
  playerId: string
  nickname: string
  image: string
}

export type JoinLobbyRequest = ICreateLobby & { lobbyId: string }

export type LobbyConnections = Record<string, WebSocket[]>
