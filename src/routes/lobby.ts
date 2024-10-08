import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { WebSocket } from 'ws'
import { CreateLobbyController } from '../controllers/lobby/CreateLobbyController'
import { GetLobbyByIdController } from '../controllers/lobby/GetLobbyByIdController'
import { JoinLobbyController } from '../controllers/lobby/JoinLobbyController'
import { LobbyConnections } from '../models/lobby'

export async function lobbyRoutes(fastify: FastifyInstance) {
  const lobbyConnections: LobbyConnections = {}

  fastify.post('/', (req: FastifyRequest, reply: FastifyReply) => {
    return new CreateLobbyController().handle(req, reply, lobbyConnections)
  })

  fastify.get('/:lobbyId', (req: FastifyRequest, reply: FastifyReply) => {
    return new GetLobbyByIdController().handle(req, reply)
  })

  fastify.get(
    '/ws/:lobbyId',
    { websocket: true },
    (conn: WebSocket, req: FastifyRequest) => {
      return new GetLobbyByIdController().handleWs(conn, req, lobbyConnections)
    },
  )

  fastify.post('/join/:lobbyId', (req: FastifyRequest, reply: FastifyReply) => {
    return new JoinLobbyController().handle(req, reply, lobbyConnections)
  })
}
