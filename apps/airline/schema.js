const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'An airline must have a name']
    },
    iata: {
        type: String,
        required: [false],
    },
    fs: {
        type: String,
        required: [false],
        unique: true
    },
    icao: {
        type: String,
        required: [false],
    },
    callsign: {
        type: String,
        required: [false]
    },
    country: {
        type: String,
        required: [false]
    },
    pec: {
        type: String,
        required: [false]
    },
    legalStreet: {
        type: String,
        required: [false]
    },
    legalPlace: {
        type: String,
        required: [false]
    },
    legalZip: {
        type: String,
        required: [false]
    },
    legalCountry: {
        type: String,
        required: [false]
    },
    email: {
        type: String,
        required: [false]
    },
    phone: {
        type: String,
        required: [false]
    },
    active: {
        type: String,
        enum: ['y', 'Y', 'n', 'N']
    },
});

module.exports = airlineSchema;