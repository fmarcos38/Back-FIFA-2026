let express
let dotenv
let cors

try {
    express = require('express')
    dotenv = require('dotenv')
    cors = require('cors')
} catch (error) {
    console.warn('Dependencias Express no instaladas. Usando servidor nativo como fallback.')
    require('./src/server')
    return
}

const { dbConnection } = require('./src/config/db')
const { createAdmin } = require('./src/config/admin')
const { seedInitialResults } = require('./src/repositories/resultsRepository')
const authRoutes = require('./src/routes/authRoutes')
const resultsRoutes = require('./src/routes/resultsRoutes')

dotenv.config()

const app = express()

const normalizeOrigin = (origin) => String(origin || '').replace(/\/$/, '')
const allowedOrigins = (process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

const isLocalDevelopmentOrigin = (origin) => {
    try {
        const { hostname } = new URL(origin)
        return hostname === 'localhost' || hostname === '127.0.0.1'
    } catch (error) {
        return false
    }
}

app.use(express.json())
app.use(
    cors({
        origin: (origin, callback) => {
            const normalizedOrigin = normalizeOrigin(origin)

            if (!origin || allowedOrigins.includes(normalizedOrigin) || isLocalDevelopmentOrigin(normalizedOrigin)) {
                return callback(null, true)
            }

            return callback(new Error('Origen no permitido por CORS'))
        },
    }),
)

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'Back FIFA 2026' })
})

app.use('/api/auth', authRoutes)
app.use('/api/results', resultsRoutes)

app.use((req, res) => {
    res.status(404).json({ ok: false, message: 'Ruta no encontrada' })
})

const startServer = async () => {
    await dbConnection()
    await seedInitialResults()
    await createAdmin()

    const PORT = process.env.PORT || 4000

    app.listen(PORT, () => {
        console.log('Servidor escuchando en puerto:', PORT)
    })
}

startServer()
