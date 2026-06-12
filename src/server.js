const http = require('http')
const { loadEnv } = require('./config/env')

loadEnv()

const { authRoutes } = require('./routes/auth')
const { dbConnection } = require('./config/db')
const { resultsRoutes } = require('./routes/results')
const { seedInitialResults } = require('./repositories/resultsRepository')
const { sendJson } = require('./utils/http')

const port = Number(process.env.PORT || 4000)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {})
    return
  }

  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'Back FIFA 2026' })
    return
  }

  if (await authRoutes(req, res, url.pathname)) {
    return
  }

  if (await resultsRoutes(req, res, url.pathname)) {
    return
  }

  sendJson(res, 404, { ok: false, message: 'Ruta no encontrada' })
})

async function startServer() {
  await dbConnection()
  await seedInitialResults()

  server.listen(port, () => {
    console.log(`Back FIFA 2026 escuchando en http://localhost:${port}`)
  })
}

startServer()
