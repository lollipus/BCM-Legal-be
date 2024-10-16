const { getAirlines } = require('./controller');

const express = require('express');

const router = express.Router();

router.get('/', getAirlines);

module.exports = router;

