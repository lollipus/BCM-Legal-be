const express = require('express')

const cors = require('cors')

const app = express()

app.use(cors())

// set body parser

app.use(express.json())


// import routes

const insightRouter = require('./apps/insight/router')

const airportRouter = require('./apps/airport/router')

const airlineRouter = require('./apps/airline/router')

const flightRouter = require('./apps/flights/router')

// use routes

app.use('/api/v1/insights', insightRouter)

app.use('/api/v1/airports', airportRouter)

app.use('/api/v1/airlines', airlineRouter)

app.use('/api/v1/flights', flightRouter)



module.exports = app;






