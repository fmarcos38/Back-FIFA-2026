const { loadEnv } = require('./env')

loadEnv()

const adminToken = process.env.ADMIN_TOKEN || 'fixture-admin-local'

function getRequestToken(req) {
  const header = req.headers.authorization || ''

  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

function isAdminRequest(req) {
  return getRequestToken(req) === adminToken
}

module.exports = {
  adminToken,
  isAdminRequest,
}
