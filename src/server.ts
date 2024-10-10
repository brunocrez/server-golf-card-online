import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server } from 'socket.io'
import { ILobby } from './models/lobby'
import {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  onDisconnect,
} from './sockets'

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080

const fastify = Fastify()
fastify.register(cors, { origin: '*' })

const lobbies = new Map<string, ILobby>()

const start = async () => {
  try {
    await fastify.listen({ port: PORT })
    console.log(`Server running at PORT ${PORT}`)

    const io = new Server(fastify.server, {
      cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
    })

    io.on('connection', (socket) => {
      createLobby(socket, lobbies)
      joinLobby(socket, lobbies)
      getLobby(socket, lobbies)
      leaveLobby(socket, lobbies)

      socket.on('disconnect', () => {
        onDisconnect(socket, lobbies)
      })
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
