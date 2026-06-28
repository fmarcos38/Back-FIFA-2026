const { deleteResult, readResults, upsertResult } = require('../repositories/resultsRepository')
const { isAdminRequest } = require('../config/authToken')
const {
  isOptionalValidGoal,
  isValidGoal,
  sanitizeMergedResult,
  validateCompletedKnockoutResult,
  validateStatus,
} = require('../utils/resultsValidation')

const getResults = async (req, res) => {
  res.json({ ok: true, results: await readResults() })
}

const updateResult = async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, message: 'No autorizado' })
  }

  const { matchId } = req.params
  const result = {}
  const hasHomeGoals = req.body.homeGoals !== undefined && req.body.homeGoals !== ''
  const hasAwayGoals = req.body.awayGoals !== undefined && req.body.awayGoals !== ''

  if (hasHomeGoals !== hasAwayGoals) {
    return res.status(400).json({
      ok: false,
      message: 'Debe cargar goles de ambos equipos',
    })
  }

  if (hasHomeGoals && hasAwayGoals) {
    result.homeGoals = Number(req.body.homeGoals)
    result.awayGoals = Number(req.body.awayGoals)
  }

  if (
    (hasHomeGoals && !isValidGoal(result.homeGoals)) ||
    (hasAwayGoals && !isValidGoal(result.awayGoals))
  ) {
    return res.status(400).json({
      ok: false,
      message: 'Los goles deben ser numeros enteros mayores o iguales a 0',
    })
  }

  if (!isOptionalValidGoal(req.body.homePenalties) || !isOptionalValidGoal(req.body.awayPenalties)) {
    return res.status(400).json({
      ok: false,
      message: 'Los penales deben ser numeros enteros mayores o iguales a 0',
    })
  }

  if (req.body.homePenalties !== undefined && req.body.homePenalties !== '') {
    result.homePenalties = Number(req.body.homePenalties)
  }

  if (req.body.awayPenalties !== undefined && req.body.awayPenalties !== '') {
    result.awayPenalties = Number(req.body.awayPenalties)
  }

  if (req.body.kickoff !== undefined) {
    result.kickoff = req.body.kickoff || null
  }

  if (req.body.status !== undefined) {
    result.status = req.body.status
  }

  if (!validateStatus(result.status)) {
    return res.status(400).json({ ok: false, message: 'Estado de partido invalido' })
  }

  const currentResults = await readResults()
  const nextResult = sanitizeMergedResult({
    ...currentResults[matchId],
    ...result,
  })
  const knockoutError = validateCompletedKnockoutResult(matchId, nextResult)

  if (knockoutError) {
    return res.status(400).json({ ok: false, message: knockoutError })
  }

  return res.json({ ok: true, results: await upsertResult(matchId, result) })
}

const removeResult = async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ ok: false, message: 'No autorizado' })
  }

  const { matchId } = req.params

  res.json({ ok: true, results: await deleteResult(matchId) })
}

module.exports = {
  getResults,
  removeResult,
  updateResult,
}
