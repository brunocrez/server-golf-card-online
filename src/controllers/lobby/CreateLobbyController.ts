import { ZodError } from 'zod'
import { FastifyReply, FastifyRequest } from 'fastify'
import { CreateLobbyService } from '../../services/lobby/CreateLobbyService'
import { ICreateLobby } from '../../models/lobby'

export class CreateLobbyController {
  async handle(req: FastifyRequest, reply: FastifyReply) {
    const service = new CreateLobbyService()
    const params = req.body as ICreateLobby
    try {
      const response = await service.execute(params)
      reply.status(201).send(response)
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          issues: error.issues,
        })
      } else {
        reply.status(500).send({ message: 'Internal Server Error' })
      }
    }
  }
}
