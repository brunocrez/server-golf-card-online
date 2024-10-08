import { ZodError } from 'zod'
import { FastifyReply, FastifyRequest } from 'fastify'
import { JoinLobbyService } from '../../services/lobby/JoinLobbyService'
import { ICreateLobby, LobbyConnections } from '../../models/lobby'

export class JoinLobbyController {
  async handle(
    req: FastifyRequest,
    reply: FastifyReply,
    lobbyConnections: LobbyConnections,
  ) {
    const joinService = new JoinLobbyService()
    const { playerId, nickname, image } = req.body as ICreateLobby
    const { lobbyId } = req.params as { lobbyId: string }
    const params = { playerId, nickname, image, lobbyId }

    try {
      const response = await joinService.execute(params, lobbyConnections)
      reply.send(response)
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          issues: error.issues,
        })
      } else {
        reply.status(500).send(error)
      }
    }
  }
}
