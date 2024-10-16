const express = require('express')

const router = express.Router()

const { getAllInsights, getInsightDetails, addInsight } = require('./controller')

// add one insight

router.post('/add', addInsight)

router.get('/', getAllInsights)

// get insight details

router.get('/:insight_id', getInsightDetails)


module.exports = router;