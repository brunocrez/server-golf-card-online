import { prisma } from '../../database/prisma-client'
import { ICreatePlayer } from '../../models/player'
import { createPlayerSchema } from '../../schemas/playerSchema'

export class CreatePlayerService {
  async execute(data: ICreatePlayer) {
    const parseData = createPlayerSchema.parse(data)
    return await prisma.player.create({ data: parseData })
  }
}
