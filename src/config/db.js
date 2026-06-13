const { MongoClient } = require('mongodb')
const { loadEnv } = require('./env')

loadEnv()

let client = null
let database = null

async function dbConnection() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.log('MongoDB no configurado. Usando persistencia JSON local.')
    return null
  }

  try {
    client = new MongoClient(uri)
    await client.connect()
    database = client.db(process.env.MONGODB_DB_NAME || 'fifa_2026')

    console.log('Conectado a MongoDB')
    return database
  } catch (error) {
    client = null
    database = null
    console.error('No se pudo conectar a MongoDB. Usando persistencia JSON local.', error.message)
    return null
  }
}

function getDb() {
  return database
}

function isMongoConnected() {
  return Boolean(database)
}

module.exports = {
  dbConnection,
  getDb,
  isMongoConnected,
}
