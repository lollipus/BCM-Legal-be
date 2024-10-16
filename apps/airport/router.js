const express = require('express')

const { getAirports } = require('./controller')


const router = express.Router()


router.get('/', getAirports)


module.exports = router;
