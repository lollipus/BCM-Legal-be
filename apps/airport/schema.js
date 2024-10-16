const mongoose = require('mongoose');

const airportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'An airport must have a name']
    },
    fs: {
        type: String,
        required: [true, 'An airport must have a fs code'],
        unique: true
    },
    iata: {
        type: String,
        required: [false],
        maxLength: 3,
    },
    icao: {
        type: String,
        required: [false],
        maxLength: 4
    },
    city: {
        type: String,
        required: [false]
    },
    state: {
        type: String,
        required: [false]
    },
    country: {
        type: String,
        required: [false]
    },
    timeZoneRegionName: {
        type: String,
        required: [false]
    },
    regionName: {
        type: String,
        required: [false]
    },
    lat: {
        type: String,
        required: [true, 'An airport must have a lat']
    },
    lon: {
        type: String,
        required: [true, 'An airport must have a lon']
    }
});

module.exports = airportSchema;
