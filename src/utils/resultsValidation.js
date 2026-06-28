const VALID_STATUSES = new Set(['NS', 'FT', 'partial', 'extraTime', 'penalties', 'finished'])

function isValidGoal(value) {
  return Number.isInteger(value) && value >= 0
}

function isOptionalValidGoal(value) {
  return value === undefined || value === '' || isValidGoal(Number(value))
}

function hasValue(value) {
  return value !== undefined && value !== ''
}

function isKnockoutMatch(matchId) {
  return /^(?:R32|R16|QF|SF|FINAL)-\d+$/.test(matchId)
}

function normalizeStatus(status) {
  return status === 'FT' ? 'finished' : status
}

function validateStatus(status) {
  return status === undefined || status === '' || VALID_STATUSES.has(status)
}

function validateCompletedKnockoutResult(matchId, result) {
  if (!isKnockoutMatch(matchId) || normalizeStatus(result.status) !== 'finished') {
    return null
  }

  if (!hasValue(result.homeGoals) || !hasValue(result.awayGoals)) {
    return 'Para finalizar una llave debe cargar goles de ambos equipos'
  }

  const homeGoals = Number(result.homeGoals)
  const awayGoals = Number(result.awayGoals)

  if (homeGoals !== awayGoals) return null

  if (!hasValue(result.homePenalties) || !hasValue(result.awayPenalties)) {
    return 'Para finalizar una llave empatada debe cargar penales'
  }

  const homePenalties = Number(result.homePenalties)
  const awayPenalties = Number(result.awayPenalties)

  if (!isValidGoal(homePenalties) || !isValidGoal(awayPenalties)) {
    return 'Los penales deben ser numeros enteros mayores o iguales a 0'
  }

  if (homePenalties === awayPenalties) {
    return 'Los penales deben definir un ganador'
  }

  return null
}

function sanitizeMergedResult(result) {
  const nextResult = { ...result }

  if (nextResult.status !== undefined) {
    nextResult.status = normalizeStatus(nextResult.status)
  }

  if (
    hasValue(nextResult.homeGoals) &&
    hasValue(nextResult.awayGoals) &&
    Number(nextResult.homeGoals) !== Number(nextResult.awayGoals)
  ) {
    delete nextResult.homePenalties
    delete nextResult.awayPenalties
  }

  return nextResult
}

module.exports = {
  isOptionalValidGoal,
  isValidGoal,
  sanitizeMergedResult,
  validateCompletedKnockoutResult,
  validateStatus,
}
