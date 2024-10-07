import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CreateLobbyController } from '../controllers/lobby/CreateLobbyController'
import { GetLobbyByIdController } from '../controllers/lobby/GetLobbyByIdController'
import { JoinLobbyController } from '../controllers/lobby/JoinLobbyController'

export async function lobbyRoutes(fastify: FastifyInstance) {
  fastify.post('/', (req: FastifyRequest, reply: FastifyReply) => {
    return new CreateLobbyController().handle(req, reply)
  })

  fastify.get('/:lobbyId', (req: FastifyRequest, reply: FastifyReply) => {
    return new GetLobbyByIdController().handle(req, reply)
  })

  fastify.post('/join/:lobbyId', (req: FastifyRequest, reply: FastifyReply) => {
    return new JoinLobbyController().handle(req, reply)
  })
}
