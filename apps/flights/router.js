const { getFlights } = require('./controller');

const express = require('express');


const router = express.Router();


router.get('/', getFlights);


module.exports = router;