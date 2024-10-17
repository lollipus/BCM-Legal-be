const { By, Browser, until, Builder } = require('selenium-webdriver');
const { Options } = require("selenium-webdriver/chrome.js");

const { Flight, Airport, Airline } = require('../../DB/flights-db/models');

const moment = require('moment-timezone');



const axios = require('axios');

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


const formattedFlight = async (flight, airportsList, airlinesList) => {

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

    flightObj.carrierAirline = await Airline.findById(flightObj.carrierAirline)

    flightObj.depAirport = await Airport.findById(flightObj.depAirport)

    flightObj.arrAirport = await Airport.findById(flightObj.arrAirport)

    if (flightObj.divAirport) {
        flightObj.divAirport = await Airport.findById(flightObj.divAirport)
    }

    if (codesharesAirlines.length > 0) {
        for (let c of flightObj.codesharesAirlines) {
            const index = flightObj.codesharesAirlines.indexOf(c)
            flightObj.codesharesAirlines[index] = await Airline.findById(c)
        }
    }



    return flightObj


}


async function searchUnsavedFlights(flightsInfo) {

    const options = new Options();

    let driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options.addArguments('--headless=new'))
        .setChromeOptions(options.setPageLoadStrategy('eager'))
        .build();



    const { depDate, depAir, flightNumber, airlineCode } = flightsInfo;



    let month = depDate.split('-')[1];
    if (month[0] === '0') {
        month = month[1];
    }
    let day = depDate.split('-')[2];
    if (day[0] === '0') {
        day = day[1];
    }
    const year = depDate.split('-')[0];



    const requestFlightUrl = `https://www.flightstats.com/v2/flight-tracker/${airlineCode}/${flightNumber}?year=${year}&month=${month}&date=${day}`

    // const requestFlightUrl = 'https://www.flightstats.com/v2/flight-tracker/FR/3720?year=2024&month=9&date=15'

    console.log(requestFlightUrl, 'REQUEST FLIGHT URL');



    await driver.get(requestFlightUrl);

    let revealed = await driver.findElement(By.css("body"));
    await driver.wait(until.elementIsVisible(revealed), 6000);

    const source = await driver.getPageSource();
    let wantSource;
    if (source.includes('__NEXT_DATA__')) {
        console.log('NEXT DATA FOUND');
        wantSource = source.split('__NEXT_DATA__')[1].split('\n')[0];
        //console.log(wantSource, 'NEXT DATA');
    } else if (source.includes('window.__data={"App')) {
        console.log('WINDOW DATA FOUND');
        wantSource = source.split('window.__data={"App')[1];
        console.log(wantSource);
    }

    wantSource = wantSource.split(';__NEXT');



    //console.log(wantSource[0].split(' = ')[1], 'WANT SOURCE');


    let flightObj = JSON.parse(wantSource[0].split(' = ')[1]);

    flightObj = flightObj.props.initialState.flightTracker.flight;

    // console.log(flightObj, 'FLIGHT OBJ');

    // console.log(flightObj.positional, 'FLIGHT flightNote');

    const wantedFlightKeys = [
        "flightId",
        "status",
        "ticketHeader",
        "operatedBy",
        "departureAirport",
        "arrivalAirport",
        "divertedAirport",
        "codeshares"
    ]

    const flightResult = {};

    for (let key of wantedFlightKeys) {

        flightResult[key] = flightObj[key];
    }



    //console.log(source);



    await new Promise(response => setTimeout(response, 10000));

    await driver.manage().deleteAllCookies();
    await driver.close();
    await driver.quit();

    const flightFormetted = await formattedFlight(flightResult, [], [])

    console.log(flightFormetted, 'flightFormetted');

    return flightFormetted;
}




module.exports = { searchUnsavedFlights };
