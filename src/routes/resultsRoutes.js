const express = require('express')
const {
  getResults,
  removeResult,
  updateResult,
} = require('../controllers/resultsController')

const router = express.Router()

router.get('/', getResults)
router.put('/:matchId', updateResult)
router.delete('/:matchId', removeResult)

module.exports = router
