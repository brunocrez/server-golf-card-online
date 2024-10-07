import { FastifyReply, FastifyRequest } from 'fastify'
import { CreateLobbyService } from '../../services/lobby/CreateLobbyService'

export class CreateLobbyController {
  async handle(req: FastifyRequest, reply: FastifyReply) {
    const service = new CreateLobbyService()
    const { nickname } = req.body as { nickname: string }
    try {
      const response = await service.execute(nickname)
      reply.status(201).send(response)
    } catch (error) {}
  }
}
