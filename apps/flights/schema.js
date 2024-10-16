const mongoose = require('mongoose');



const flightSchema = new mongoose.Schema({
    finalStatus: {
        type: String,
        enum: ["Cancelled", "On time", "Diverted", "Delayed", "On Time"]
    },
    departureDelay: Number,
    arrivalDelay: Number,
    carrierAirline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    carrierFlightNumber: String,
    operatedBy: String,
    depAirport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport',
        required: true
    },
    depDate: {
        type: Date,
        required: true
    },
    depActualDate: {
        type: Date,
        required: false
    },
    depGate: String,
    depTerminal: String,
    arrAirport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport',
        required: true
    },
    arrGate: String,
    arrTerminal: String,
    arrBaggage: String,
    arrDate: {
        type: Date,
        required: true
    },
    arrActualDate: {
        type: Date,
        required: false
    },
    divAirport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airport',
        required: false
    },
    divGate: {
        type: String,
        required: false
    },
    divTerminal: {
        type: String,
        required: false
    },
    divBaggage: {
        type: String,
        required: false
    },
    divDate: {
        type: Date,
        required: false
    },
    codesharesAirlines: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Airline' }],
        required: false
    },
    codesharesNumbers: {
        type: [String],
        required: false
    },
    slug: {
        type: String,
        unique: true
    }
},
    {
        toJSON: { virtuals: true }
    })

// flightSchema.pre('save', function (next) {
//     this.slug = `${this.ticketHeader.airline.name.toLowerCase()}-${this.ticketHeader.flightNumber}-${this.departure.airport.name.toLowerCase()}-${this.arrival.airport.name.toLowerCase()}-${this.departure.date.toISOString().split('T')[0]}`
//     console.log(this.slug)
//     next()
// })



flightSchema.virtual('statusDescription').get(function () {

    const status = this.finalStatus;

    let statusDescription = '';

    if (this.finalStatus.includes("elayed")) {
        statusDescription = 'Delayed by';
        const hrsDelayed = (this.arrivalDelay / 60 + "").split('.')[0] //.toFixed(0)
        const minDelayed = this.arrivalDelay % 60
        if (hrsDelayed > 0) {
            statusDescription = statusDescription + ` ${hrsDelayed}h`
        }
        if (minDelayed > 0) {
            statusDescription = statusDescription + ` ${minDelayed}min`
        }
    } else if (this.finalStatus === 'Cancelled') {
        statusDescription = this.finalStatus;
    } else if (this.finalStatus === 'Diverted') {
        statusDescription = `Diverted to ${divAirport.name} (${divAirport.fs})`
    }

    return statusDescription
})



flightSchema.virtual('codeshares').get(function () {

    console.log('virtual running now')

    let codeshares;
    if (this.codesharesAirlines && this.codesharesAirlines.length === 0) {
        return null
    } else if (this.codesharesAirlines && this.codesharesAirlines.length > 0) {
        codeshares = []
        for (let i = 0; i < this.codesharesAirlines.length; i++) {


            let fs;

            fs = this.codesharesAirlines[i].fs

            codeshares.push({
                iata: this.codesharesAirlines[i].iata ? this.codesharesAirlines[i].iata : null,
                fs: fs,
                name: this.codesharesAirlines[i].name,
                flightNumber: this.codesharesNumbers[i]
            })
        }
        console.log(codeshares);

        return codeshares
    }


})

module.exports = flightSchema;