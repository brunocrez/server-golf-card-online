import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server } from 'socket.io'
import { ILobby } from './models/lobby'
import { onDisconnect } from './sockets/onDisconnect'
import { gameHandler } from './sockets/gameHandler'
import { lobbyHandler } from './sockets/lobbyHandler'

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
      console.log('Connecting: ', socket.id)
      const {
        startGame,
        flipCard,
        replaceCard,
        discardDrawnCard,
        drawCardFromDeck,
      } = gameHandler(socket, lobbies)
      const { createLobby, joinLobby, getLobby, leaveLobby } = lobbyHandler(
        socket,
        lobbies,
      )

      createLobby()
      joinLobby()
      getLobby()
      leaveLobby()
      startGame()
      flipCard()
      replaceCard()
      discardDrawnCard()
      drawCardFromDeck()

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
