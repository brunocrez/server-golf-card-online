import Fastify from 'fastify'
import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { routes } from './routes'

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080

const fastify = Fastify()
fastify.register(ws)
fastify.register(cors, { origin: '*' })
fastify.register(routes)

fastify.listen({ port: PORT }, () => {
  console.log('HTTP Server Running!')
})
