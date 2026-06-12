const { loadEnv } = require('./env')

loadEnv()

const adminUser = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin2026',
}

async function createAdmin() {
  console.log(`Admin disponible: ${adminUser.username}`)
}

module.exports = { adminUser, createAdmin }
