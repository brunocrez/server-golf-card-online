import { prisma } from '../../database/prisma-client'
import { ILobby } from '../../models/lobby'
import { GetLobbyByIdService } from './GetLobbyByIdService'

export class UpdateLobbyService {
  async execute(params: ILobby) {
    const getLobby = new GetLobbyByIdService()
    const currLobby = await getLobby.execute(params.id)

    if (!currLobby) {
      throw new Error('We could not find this lobby!')
    }

    return await prisma.lobby.update({ where: { id: params.id }, data: params })
  }
}
