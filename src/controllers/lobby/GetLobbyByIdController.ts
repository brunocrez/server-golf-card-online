import { FastifyReply, FastifyRequest } from 'fastify'
import { GetLobbyByIdService } from '../../services/lobby/GetLobbyByIdService'

export class GetLobbyByIdController {
  async handle(req: FastifyRequest, reply: FastifyReply) {
    const service = new GetLobbyByIdService()
    const { lobbyId } = req.params as { lobbyId: string }

    try {
      const response = await service.execute(lobbyId)

      if (!response) {
        reply.status(204).send(response)
      }

      reply.send(response)
    } catch (error) {}
  }
}
