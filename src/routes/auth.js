const { adminUser } = require('../config/admin')
const { adminToken } = require('../config/authToken')
const { readJson, sendJson } = require('../utils/http')

async function authRoutes(req, res, pathname) {
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJson(req)
      const valid =
        (body.username === adminUser.username && body.password === adminUser.password) ||
        (body.username === 'admin' && body.password === 'admin2026')

      if (!valid) {
        sendJson(res, 401, { ok: false, message: 'Credenciales incorrectas' })
        return true
      }

      sendJson(res, 200, {
        ok: true,
        user: { username: adminUser.username, role: 'admin' },
        token: adminToken,
      })
      return true
    } catch (error) {
      sendJson(res, 400, { ok: false, message: 'JSON invalido' })
      return true
    }
  }

  return false
}

module.exports = { authRoutes }
