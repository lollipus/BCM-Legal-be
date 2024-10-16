const mongoose = require('mongoose');

const connectDBs = require('../dbs')

const { dbFlight } = connectDBs()

const airportSchema = require('../../apps/airport/schema')

const Airport = dbFlight.model('Airport', airportSchema);

const airlineSchema = require('../../apps/airline/schema')

const Airline = dbFlight.model('Airline', airlineSchema);

const flightSchema = require('../../apps/flights/schema')

const Flight = dbFlight.model('Flight', flightSchema);


module.exports = { Airport, Airline, Flight }