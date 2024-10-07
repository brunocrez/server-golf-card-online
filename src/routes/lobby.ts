import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CreateLobbyController } from '../controllers/lobby/CreateLobbyController'

export async function lobbyRoutes(fastify: FastifyInstance) {
  fastify.post('/', (req: FastifyRequest, reply: FastifyReply) => {
    return new CreateLobbyController().handle(req, reply)
  })
}
