import { ZodError } from 'zod'
import { FastifyReply, FastifyRequest } from 'fastify'
import { JoinLobbyService } from '../../services/lobby/JoinLobbyService'
import { ICreateLobby } from '../../models/lobby'

export class JoinLobbyController {
  async handle(req: FastifyRequest, reply: FastifyReply) {
    const joinService = new JoinLobbyService()
    const { playerId, nickname, image } = req.body as ICreateLobby
    const { lobbyId } = req.params as { lobbyId: string }

    try {
      const response = await joinService.execute({
        playerId,
        nickname,
        lobbyId,
        image,
      })
      reply.status(200).send(response)
    } catch (error) {
      // console.log(error)
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
