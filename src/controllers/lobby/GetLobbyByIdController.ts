import { FastifyReply, FastifyRequest } from 'fastify'
import { WebSocket } from 'ws'
import { GetLobbyByIdService } from '../../services/lobby/GetLobbyByIdService'
import { LobbyConnections } from '../../models/lobby'

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

  async handleWs(
    conn: WebSocket,
    req: FastifyRequest,
    lobbyConnections: LobbyConnections,
  ) {
    const { lobbyId } = req.params as { lobbyId: string }

    if (!lobbyConnections[lobbyId]) {
      lobbyConnections[lobbyId] = []
    }

    lobbyConnections[lobbyId].push(conn)

    conn.on('close', () => {
      lobbyConnections[lobbyId] = lobbyConnections[lobbyId].filter(
        (client) => client !== conn,
      )
    })
  }
}
