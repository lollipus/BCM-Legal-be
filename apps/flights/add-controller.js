const { Airport, Airline, Flight } = require('../../DB/flights-db/models');


// WORK AIRLINE FUNCTION
// i use this function to work with the airlines
// i check if the airline is already in the database
// if it is i return the id of the airline
// if it is not i create a new airline and i return the id of the new airline
// i create new airline with the airline code and the airline name
// if the airline code is 2 characters i set it as iata
// if the airline code is 3 characters i set it as icao
// i always set the fs code
// i save the new airline 
const workAirline = async (airlineCode, airlineName, airlinesList) => {
    // console.log(airlinesList.length, 'airlinesList length');
    let airlineObj;

    airlineObj = await Airline.findOne({
        $or: [
            { fs: airlineCode },
            { name: airlineName }
        ]
    })

    // console.log(airlineObj, airlineName, 'airline params');
    // console.log(airlineObj, 'airlineObj');
    let id;
    if (!airlineObj) {
        let newAirline = new Airline({
            name: airlineName,
            fs: airlineCode
        })
        if (airlineCode.length === 2) {
            newAirline.iata = airlineCode
        } else if (airlineCode.length === 3) {
            newAirline.icao = airlineCode
        }
        await newAirline.save()
        id = newAirline._id
        console.log(newAirline, 'newAirline added');

    } else {
        id = airlineObj._id
    }
    return id
}


// WORK AIRPORT FUNCTION
// i use this function to work with the airports
// i check if the airport is already in the database
// if it is i return the id of the airport
// if it is not i create a new airport and i return the id of the new airport
// i create new airport with the airport code and the airport name
// if the airport code is 3 characters i set it as iata
// if the airport code is 4 characters i set it as icao
// i always set the fs code
// i save the new airport
const workAirport = async (airport, airportsList) => {

    let airportObj;
    if (!airportObj) {
        airportObj = await Airport.findOne({
            fs: airport.fs
        })
    }

    if (airportObj) {
        return airportObj._id
    } else {
        let newAirport

        newAirport = new Airport({
            name: airport.name,
            city: airport.city,
            state: airport.state,
            country: airport.country,
            fs: airport.fs,
            timeZoneRegionName: airport.timeZoneRegionName,
            regionName: airport.regionName,
            lat: 'unknown',
            lon: 'unknown'
        })
        if (airport.fs.length === 3) {
            newAirport.iata = airport.fs
        } else if (airport.fs.length === 4) {
            newAirport.icao = airport.fs
        }
        await newAirport.save()

        console.log(newAirport, 'newAirport added');

        return newAirport._id
    }

}


const convertTimeFromATimezoneToOurTimezone = (date, timezone) => {



    // Stringa ISO della data nel fuso orario di partenza (Europe/Rome)
    const localDateString = date;

    // Fuso orario di partenza
    const sourceTimezone = timezone;

    // Fuso orario di destinazione
    const targetTimezone = 'Europe/Rome';

    // Converti la data dal fuso orario di partenza a quello di destinazione
    const convertedDate = moment.tz(localDateString, sourceTimezone).tz(targetTimezone);

    // console.log(date, convertedDate.format().split('+')[0] + '.000', timezone, 'date, convertedDate, timezone');

    const result = convertedDate.format().split('+')[0]

    return result;

}

// i use this function to determinate the actual time of the flight
// i use the original date, the delay in minutes and the actual hour
// if the delay is equal to 0 i use the actual hour
// if the delay is more than 0 i add the delay to the original date
// and i return the actual date
const determinateActualTime = (originalDate, delayMinutes, actualHourGiven, timezoneRegion) => {

    let actual;

    // console.log(originalDate, 'originalDate');



    if (delayMinutes === 0) {

        const hourActual = actualHour.split(':')[0];
        const minutesActual = actualHour.split(':')[1];

        const originalDateString = originalDate.split('T')[0];

        const newStringDate = originalDateString + 'T' + hourActual + ':' + minutesActual + ':00.000';

        const convertedDateString = convertTimeFromATimezoneToOurTimezone(newStringDate, timezoneRegion);

        actual = new Date(convertedDateString);

        return actual;

    } else if (delayMinutes > 0) {

        const convertedDateString = convertTimeFromATimezoneToOurTimezone(originalDate, timezoneRegion);

        const orDateInMinutes = new Date(convertedDateString).getTime() / 60000;

        const newDateInMinutes = orDateInMinutes + delayMinutes;

        actual = newDateInMinutes * 60000;

        return new Date(actual);

    }

    // console.log(actual, 'actual');



}


// FORMATTED FLIGHT FUNCTION 
// i use this function to format the flight
// i get the flight, the airports list and the airlines list
// i get the departure airport, the arrival airport
// if the flight is diverted i get the diverted airport
// the carrier airline
// if codeshares are available i get
// the codeshares airlines
// i get the carrier flight number, the codeshares flight numbers
// i get the flight slug
// if the departure actual date and the arrival actual date are available
// i determinate the actual time of both departure and arrival date
const formattedFlightFunction = async (flight, airportsList, airlinesList) => {

    let departureAirport;

    try {
        departureAirport = await workAirport(flight.departureAirport, airportsList)
    } catch (err) {
        console.log(err.message, 'error');
        departureAirport = await workAirport(flight.departureAirport, airportsList)
    }

    if (!departureAirport) {
        return new Error('departureAirport not found')
    }



    let arrivalAirport;
    try {
        arrivalAirport = await workAirport(flight.arrivalAirport, airportsList)
    } catch (err) {
        console.log(err.message, 'error');
        arrivalAirport = await workAirport(flight.arrivalAirport, airportsList)
    }

    if (!arrivalAirport) {
        return new Error('arrivalAirport not found')
    }


    let divertedAirport;
    if (flight.status.diverted === true) {
        try {
            divertedAirport = await workAirport(flight.divertedAirport, airportsList)
        } catch (err) {
            console.log(err.message, 'error');
            divertedAirport = await workAirport(flight.divertedAirport, airportsList)

        }
        if (!divertedAirport) {
            return new Error('divertedAirport not found')
        }
    }


    let carrierAirline;


    try {
        carrierAirline = await workAirline(
            flight.ticketHeader.carrier.fs,
            flight.ticketHeader.carrier.name,
            airlinesList
        )
    } catch (err) {
        console.log(err.message, 'error');
        carrierAirline = await workAirline(
            flight.ticketHeader.carrier.fs,
            flight.ticketHeader.carrier.name,
            airlinesList
        )

    }
    if (!carrierAirline) {
        return new Error('carrierAirline not found')
    }




    const carrierFlightNumber = flight.ticketHeader.flightNumber

    const codesharesAirlines = []
    const codesharesFlightNumbers = []


    if (flight.codeshares.length > 0) {
        await Promise.all(flight.codeshares.map(async c => {

            let codeshareAirline;

            try {
                codeshareAirline = await workAirline(
                    c.fs,
                    c.name,
                    airlinesList
                )
            } catch (err) {
                console.log(err.message, 'error');
                codeshareAirline = await workAirline(
                    c.fs,
                    c.name,
                    airlinesList
                )
            }
            if (!codeshareAirline) {
                return new Error('codeshareAirline not found')
            }
            codesharesAirlines.push(codeshareAirline)
            codesharesFlightNumbers.push(c.flightNumber)
        }))

    }




    const flightObj = {
        finalStatus: flight.status.finalStatus,
        departureDelay: flight.status.delay.departure.minutes,
        arrivalDelay: flight.status.delay.arrival.minutes,
        carrierAirline: carrierAirline,
        carrierFlightNumber: carrierFlightNumber,
        operatedBy: flight.operatedBy,
        depAirport: departureAirport,
        depGate: flight.departureAirport.gate,
        depTerminal: flight.departureAirport.terminal,
        depDate: new Date(convertTimeFromATimezoneToOurTimezone(flight.departureAirport.date, flight.departureAirport.timeZoneRegionName)),
        arrAirport: arrivalAirport,
        arrGate: flight.arrivalAirport.gate,
        arrTerminal: flight.arrivalAirport.terminal,
        arrBaggage: flight.arrivalAirport.baggage,
        arrDate: new Date(convertTimeFromATimezoneToOurTimezone(flight.arrivalAirport.date, flight.arrivalAirport.timeZoneRegionName)),

        // ref: flight.flightId
    }

    const flightSlug = `${flight.ticketHeader.carrier.fs}${flight.ticketHeader.flightNumber}${flight.departureAirport.fs}${flight.arrivalAirport.fs}${flight.departureAirport.date}${flight.arrivalAirport.date}`

    flightObj.slug = flightSlug

    if (flight.status.delay.departure.minutes > 0) {
        flightObj.depActualDate = determinateActualTime(flightObj.depDate, flight.status.delay.departure.minutes, flight.departureAirport.times.estimatedActual.time24, flight.departureAirport.timeZoneRegionName)
    }



    if (flight.status.delay.arrival.minutes > 0) {
        flightObj.arrActualDate = determinateActualTime(flightObj.arrDate, flight.status.delay.arrival.minutes, flight.arrivalAirport.times.estimatedActual.time24, flight.arrivalAirport.timeZoneRegionName)
    }


    // if (
    //     flight.departureAirport.times.scheduled &&
    //     Object.keys(flight.departureAirport.times.scheduled).includes('timezone') ||
    //     flight.departureAirport.times.estimatedActual &&
    //     Object.keys(flight.departureAirport.times.estimatedActual).includes('timezone')
    // ) {
    //     flightObj.depTimeZone = (
    //         flight.departureAirport.times.scheduled ?
    //             flight.departureAirport.times.scheduled.timezone :
    //             flight.departureAirport.times.estimatedActual.timezone
    //     )
    // }

    // if (
    //     flight.arrivalAirport.times.scheduled &&
    //     Object.keys(flight.arrivalAirport.times.scheduled).includes('timezone') ||
    //     flight.arrivalAirport.times.estimatedActual &&
    //     Object.keys(flight.arrivalAirport.times.estimatedActual).includes('timezone')
    // ) {
    //     flightObj.arrTimeZone = (
    //         flight.arrivalAirport.times.scheduled ?
    //             flight.arrivalAirport.times.scheduled.timezone :
    //             flight.arrivalAirport.times.estimatedActual.timezone)
    // }

    if (codesharesAirlines.length > 0) {
        flightObj.codesharesAirlines = codesharesAirlines
        flightObj.codesharesNumbers = codesharesFlightNumbers
    }

    if (divertedAirport) {
        flightObj.divAirport = divertedAirport
        flightObj.divGate = flight.divertedAirport.gate
        flightObj.divTerminal = flight.divertedAirport.terminal
        flightObj.divBaggage = flight.divertedAirport.baggage
        flightObj.divDate = convertTimeFromATimezoneToOurTimezone(flight.divertedAirport.date, flight.divertedAirport.timeZoneRegionName)
    }

    // if (flightObj.divAirport || flightObj.codesharesAirlines && flightObj.codesharesAirlines.length > 0) {
    //     console.log(flightObj, 'flightObj');
    // }


    return flightObj


}


const addSingleFlight = async (flight) => {

    try {


        console.log(flight, 'flight');


        const airportsList = await Airport.find();

        const airlinesList = await Airline.find();

        const formattedFlight = await formattedFlightFunction(flight, airportsList, airlinesList);

        const flightToAdd = new Flight(formattedFlight);

        await flightToAdd.save();

        res.status(200).json({
            status: 'success',
            message: 'Flight added successfully',
            flights: flightToAdd
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        })
    }
}


module.exports = addSingleFlight