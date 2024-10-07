import { v4 as uuid } from 'uuid'
import { genRandomKey } from '../../utils/genRandomKey'

const ROOM_LIMIT_PLAYERS = 6
const ROUNDS_LIMIT = 5

export class CreateLobbyService {
  async execute(nickname: string) {
    const roomKey = genRandomKey()
    return {
      nickname,
      host: uuid(),
      rounds: ROUNDS_LIMIT,
      room_limit_players: ROOM_LIMIT_PLAYERS,
      room: roomKey,
      status: 'WAITING',
    }
  }
}
