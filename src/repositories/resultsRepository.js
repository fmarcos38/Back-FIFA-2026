const fs = require('fs')
const path = require('path')
const { getDb, isMongoConnected } = require('../config/db')
const { sanitizeMergedResult } = require('../utils/resultsValidation')

const dataDir = path.join(process.cwd(), 'data')
const resultsPath = path.join(dataDir, 'results.json')
const seedPath = path.join(dataDir, 'results.seed.json')
const collectionName = 'results'

function ensureResultsFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(resultsPath)) {
    const seed = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, 'utf8') : '{}\n'
    fs.writeFileSync(resultsPath, seed)
  }
}

function readSeedResults() {
  if (!fs.existsSync(seedPath)) return {}

  try {
    return JSON.parse(fs.readFileSync(seedPath, 'utf8'))
  } catch (error) {
    return {}
  }
}

function readJsonResults() {
  ensureResultsFile()

  try {
    return JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
  } catch (error) {
    return {}
  }
}

function writeJsonResults(results) {
  ensureResultsFile()
  fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`)
}

function mergeSeedWithResults(results) {
  const seed = readSeedResults()
  const mergedResults = { ...results }

  Object.entries(seed).forEach(([matchId, seedResult]) => {
    const currentResult = mergedResults[matchId]

    if (!currentResult) {
      mergedResults[matchId] = {
        ...seedResult,
      }
      return
    }

    if (currentResult.source === 'public-seed') {
      const editableFields = [
        'homeGoals',
        'awayGoals',
        'homePenalties',
        'awayPenalties',
        'kickoff',
        'status',
      ]
      const wasEdited = editableFields.some(
        (field) => currentResult[field] !== seedResult[field],
      )

      mergedResults[matchId] = wasEdited
        ? { ...currentResult, source: 'admin' }
        : { ...currentResult, ...seedResult }
      return
    }

    if (!currentResult.kickoff && seedResult.kickoff) {
      mergedResults[matchId] = {
        ...currentResult,
        kickoff: seedResult.kickoff,
        status: currentResult.status || seedResult.status,
      }
    }
  })

  return mergedResults
}

function getResultsCollection() {
  return getDb().collection(collectionName)
}

function toResultsMap(documents) {
  return Object.fromEntries(
    documents.map(({ _id, matchId, updatedAt, ...result }) => [matchId || _id, result]),
  )
}

async function readResults() {
  if (!isMongoConnected()) {
    return readJsonResults()
  }

  const documents = await getResultsCollection().find({}).toArray()
  return toResultsMap(documents)
}

async function writeResults(results) {
  if (!isMongoConnected()) {
    writeJsonResults(results)
    return results
  }

  const collection = getResultsCollection()
  await collection.deleteMany({})

  const documents = Object.entries(results).map(([matchId, result]) => ({
    matchId,
    ...result,
    updatedAt: new Date(),
  }))

  if (documents.length > 0) {
    await collection.insertMany(documents)
  }

  return results
}

async function upsertResult(matchId, result) {
  if (!isMongoConnected()) {
    const results = readJsonResults()
    results[matchId] = sanitizeMergedResult({
      ...results[matchId],
      ...result,
      source: 'admin',
    })
    writeJsonResults(results)
    return results
  }

  const collection = getResultsCollection()
  const currentResult = await collection.findOne({ matchId })
  const { _id, ...currentData } = currentResult || {}
  const nextResult = sanitizeMergedResult({
    ...currentData,
    ...result,
    matchId,
    source: 'admin',
    updatedAt: new Date(),
  })
  const unsetFields = {}

  if (nextResult.homePenalties === undefined) {
    unsetFields.homePenalties = ''
  }

  if (nextResult.awayPenalties === undefined) {
    unsetFields.awayPenalties = ''
  }

  await collection.updateOne(
    { matchId },
    {
      $set: nextResult,
      ...(Object.keys(unsetFields).length > 0 ? { $unset: unsetFields } : {}),
    },
    { upsert: true },
  )

  return readResults()
}

async function seedInitialResults() {
  const mergedResults = mergeSeedWithResults(
    isMongoConnected() ? await readResults() : readJsonResults(),
  )

  await writeResults(mergedResults)
  return mergedResults
}

async function deleteResult(matchId) {
  if (!isMongoConnected()) {
    const results = readJsonResults()
    delete results[matchId]
    writeJsonResults(results)
    return results
  }

  await getResultsCollection().deleteOne({ matchId })
  return readResults()
}

module.exports = {
  deleteResult,
  ensureResultsFile,
  readResults,
  seedInitialResults,
  upsertResult,
  writeResults,
}
