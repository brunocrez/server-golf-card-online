import { IPlayer } from '../models/player'
import { FIRST_TURN_MOVES_COUNT } from './game'

interface ICreatePlayer {
  nickname: string
  playerId: string
  image: string
}

export const createPlayer = (
  payload: ICreatePlayer,
  isHost: boolean,
): IPlayer => {
  return {
    ...payload,
    cards: undefined,
    movesLeft: FIRST_TURN_MOVES_COUNT,
    isHost,
    score: [0, 0, 0],
  }
}
