const { deleteResult, readResults, upsertResult } = require('../repositories/resultsRepository')
const { isAdminRequest } = require('../config/authToken')
const { readJson, sendJson } = require('../utils/http')

function isValidGoal(value) {
  return Number.isInteger(value) && value >= 0
}

function isOptionalValidGoal(value) {
  return value === undefined || value === '' || isValidGoal(Number(value))
}

async function resultsRoutes(req, res, pathname) {
  if (pathname === '/api/results' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, results: await readResults() })
    return true
  }

  const match = pathname.match(/^\/api\/results\/([^/]+)$/)

  if (!match) return false

  const matchId = decodeURIComponent(match[1])

  if (req.method === 'PUT') {
    if (!isAdminRequest(req)) {
      sendJson(res, 401, { ok: false, message: 'No autorizado' })
      return true
    }

    try {
      const body = await readJson(req)
      const result = {}
      const hasHomeGoals = body.homeGoals !== undefined && body.homeGoals !== ''
      const hasAwayGoals = body.awayGoals !== undefined && body.awayGoals !== ''

      if (hasHomeGoals !== hasAwayGoals) {
        sendJson(res, 400, { ok: false, message: 'Debe cargar goles de ambos equipos' })
        return true
      }

      if (hasHomeGoals && hasAwayGoals) {
        result.homeGoals = Number(body.homeGoals)
        result.awayGoals = Number(body.awayGoals)
      }

      if (
        (hasHomeGoals && !isValidGoal(result.homeGoals)) ||
        (hasAwayGoals && !isValidGoal(result.awayGoals))
      ) {
        sendJson(res, 400, { ok: false, message: 'Los goles deben ser numeros enteros mayores o iguales a 0' })
        return true
      }

      if (!isOptionalValidGoal(body.homePenalties) || !isOptionalValidGoal(body.awayPenalties)) {
        sendJson(res, 400, { ok: false, message: 'Los penales deben ser numeros enteros mayores o iguales a 0' })
        return true
      }

      if (body.homePenalties !== undefined && body.homePenalties !== '') {
        result.homePenalties = Number(body.homePenalties)
      }

      if (body.awayPenalties !== undefined && body.awayPenalties !== '') {
        result.awayPenalties = Number(body.awayPenalties)
      }

      if (body.kickoff !== undefined) {
        result.kickoff = body.kickoff || null
      }

      if (body.status !== undefined) {
        result.status = body.status
      }

      const results = await upsertResult(matchId, result)
      sendJson(res, 200, { ok: true, results })
      return true
    } catch (error) {
      sendJson(res, 400, { ok: false, message: 'JSON invalido' })
      return true
    }
  }

  if (req.method === 'DELETE') {
    if (!isAdminRequest(req)) {
      sendJson(res, 401, { ok: false, message: 'No autorizado' })
      return true
    }

    const results = await deleteResult(matchId)
    sendJson(res, 200, { ok: true, results })
    return true
  }

  return false
}

module.exports = { resultsRoutes }
