let express
let dotenv

try {
    express = require('express')
    dotenv = require('dotenv')
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

app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204)
    }

    return next()
})

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

startServer().catch((error) => {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
})
