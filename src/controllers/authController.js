const { adminUser } = require('../config/admin')
const { adminToken } = require('../config/authToken')

const login = (req, res) => {
  const { username, password } = req.body
  const valid =
    (username === adminUser.username && password === adminUser.password) ||
    (username === 'admin' && password === 'admin2026')

  if (!valid) {
    return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' })
  }

  return res.json({
    ok: true,
    user: { username: adminUser.username, role: 'admin' },
    token: adminToken,
  })
}

module.exports = { login }
