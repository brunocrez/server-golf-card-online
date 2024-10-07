import { FastifyInstance } from 'fastify'
import { lobbyRoutes } from './routes/lobby'

export async function routes(fastify: FastifyInstance) {
  fastify.register(lobbyRoutes, { prefix: '/lobby' })
}
