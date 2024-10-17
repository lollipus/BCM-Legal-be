const { Flight, Airport, Airline } = require('../../DB/flights-db/models');
const { searchUnsavedFlights } = require('./get-unsaved-flight-info');



// DIAGNOSTIC FUNCTION
// it returns 
const diagnosticFunction = async (depAir, depDate, arrAir, arrDate) => {

    // console.log(depAir, depDate, arrAir, arrDate, 'diagnosticFunction');

    // if (!depAir && !depDate && !arrAir && !arrDate) {
    //     const {
    //         depAirport,
    //         depDate,
    //         arrAirport,
    //         arrDate
    //     } = req.body;
    // }


    if (!depAir || !depDate || !arrAir || !arrDate) {
        return res.status(400).json({
            message: "Missing parameters"
        })
    }


    const departureAirport = await Airport.findOne({
        $or: [
            { iata: depAir },
            { fs: depAir },
            { icao: depAir }
        ]
    });

    if (!departureAirport) {
        return res.status(404).json({
            message: "Departure airport not found"
        })
    }

    const arrivalAirport = await Airport.findOne({
        $or: [
            { iata: arrAir },
            { fs: arrAir },
            { icao: arrAir }
        ]
    });

    if (!arrivalAirport) {
        return res.status(404).json({
            message: "Arrival airport not found"
        })
    }

    const startDepartureInterval = new Date(depDate).getTime() - 1000 * 60 * 60 * 4
    const finalDepartureInterval = new Date(depDate).getTime() + 1000 * 60 * 60 * 4

    console.log(new Date(startDepartureInterval).toISOString(), '\n', new Date(finalDepartureInterval).toISOString(), '\n', 'startDepartureInterval, finalDepartureInterval');


    const relatedDepartureFlights = await Flight.find({
        'depAirport': departureAirport._id,
        'depDate': {
            $gte: new Date(depDate).getTime() - 1000 * 60 * 60 * 4,
            $lt: new Date(depDate).getTime() + 1000 * 60 * 60 * 4
        }
    });

    const startArrivalInterval = new Date(arrDate).getTime() - 1000 * 60 * 60 * 4
    const finalArrivalInterval = new Date(arrDate).getTime() + 1000 * 60 * 60 * 4

    console.log(new Date(startArrivalInterval).toISOString(), '\n', new Date(finalArrivalInterval).toISOString(), '\n', 'startArrivalInterval, finalArrivalInterval');

    const relatedArrivalFlights = await Flight.find({
        'arrAirport': arrivalAirport._id,
        'arrDate': {
            $gte: new Date(arrDate).getTime() - 1000 * 60 * 60 * 4,
            $lt: new Date(arrDate).getTime() + 1000 * 60 * 60 * 4
        }
    });

    const relatedDelayedDepartureFlights = relatedDepartureFlights.filter(flight => flight.departureDelay > 150);

    const relatedCancelledDepartureFlights = relatedDepartureFlights.filter(flight => flight.finalStatus === 'Cancelled');

    const relatedDelayedArrivalFlights = relatedArrivalFlights.filter(flight => flight.arrivalDelay > 150 && flight.finalStatus !== 'Diverted' && flight.finalStatus !== 'Cancelled');

    const relatedCancelledArrivalFlights = relatedArrivalFlights.filter(flight => flight.finalStatus === 'Cancelled');

    const relatedDivertedArrivalFlights = relatedArrivalFlights.filter(flight => flight.finalStatus === 'Diverted');

    const departureRelatedProblematicFlightsLen = relatedDelayedDepartureFlights.length + relatedCancelledDepartureFlights.length;

    const percentageOfRelatedDepartureProblematicFlights = (departureRelatedProblematicFlightsLen / relatedDepartureFlights.length) * 100;

    const arrivalRelatedProblematicFlightsLen = relatedDelayedArrivalFlights.length + relatedCancelledArrivalFlights.length + relatedDivertedArrivalFlights.length;

    const percentageOfArrivalRelateProblematicFlights = (arrivalRelatedProblematicFlightsLen / relatedArrivalFlights.length) * 100;

    const diagnostic = {
        departureAirportIata: departureAirport.iata,
        departureStartInterval: new Date(startDepartureInterval).toISOString(),
        departureFinalInterval: new Date(finalDepartureInterval).toISOString(),
        departureRelatedFlights: relatedDepartureFlights.length,
        departureDelayedFlights: relatedDelayedDepartureFlights.length,
        departureCancelledFlights: relatedCancelledDepartureFlights.length,
        departureRelatedProblematicFlightsLen,
        percentageOfRelatedDepartureProblematicFlights: percentageOfRelatedDepartureProblematicFlights.toFixed(2),
        arrivalAirportIata: arrivalAirport.iata,
        arrivalStartInterval: new Date(startArrivalInterval).toISOString(),
        arrivalFinalInterval: new Date(finalArrivalInterval).toISOString(),
        arrivalRelatedFlights: relatedArrivalFlights.length,
        arrivalDelayedFlights: relatedDelayedArrivalFlights.length,
        arrivalCancelledFlights: relatedCancelledArrivalFlights.length,
        arrivalDivertedFlights: relatedDivertedArrivalFlights.length,
        arrivalRelatedProblematicFlightsLen,
        percentageOfArrivalRelateProblematicFlights: percentageOfArrivalRelateProblematicFlights.toFixed(2)
    }

    return diagnostic;
}

const diagnosticRequest = async (req, res) => {

    const {
        depAirport,
        depDate,
        arrAirport,
        arrDate
    } = req.body;

    if (!depAirport || !depDate || !arrAirport || !arrDate) {
        return res.status(400).json({
            message: "Missing parameters"
        })
    }

    const diagnostic = await diagnosticFunction(depAirport, depDate, arrAirport, arrDate);

    res.status(200).json({
        message: `Diagnostic for departures from ${depAirport} and arrivals from ${arrAirport} rispectively in ${depDate}UTC and ${arrDate}UTC`,
        diagnostic
    })



}


// function that given an airport code and a date check for flight departure or arrival in that airport in that date
const getFlights = async (req, res) => {

    console.log(req.query, 'query');

    const { depairp, date, flightnum, airlinecode, diagnostic, airlinename } = req.query;

    const diagnosticBool = diagnostic === 'true' ? true : false;

    console.log(req.query, 'query');



    // find the airport that have as iata, fs or icao the airport code
    const departureAirport = await Airport.findOne({
        fs: depairp
    });

    // check if departure airport exists otherwise return 404

    if (!departureAirport) {
        return res.status(404).json({
            message: "Airport not found"
        })
    } else {
        console.log(departureAirport._id, 'airport');
    }

    console.log(airlinecode, 'airlinecode');

    console.log(airlinename, 'airlineName');
    // find the airline by the airline code that have to be the same of iata or fs or icao
    const airline = await Airline.findOne({
        $or: [
            { iata: airlinecode },
            { icao: airlinecode },
            { name: airlinename }
            // airlinename ? { "name": { $regex: airlinename, $options: 'i' } } : {}
        ]
    });

    console.log(airline, 'airline');

    // check if airline exists otherwise return 404
    if (!airline) {
        return res.status(404).json({
            message: "Airline not found"
        })
    } else {
        console.log(airline._id, 'airline');
    }

    // find a flight where departure airport is the airport found
    // the departure.date is between the date 00:00:00 and 23:59:59
    // flight ticket header flight number and ticket header airline are the flight number and airline in the query or 
    // one of the codeshare of codeshares's flights has flight number and airline that are equal to flight number and airline in the query

    // console.log(new Date(date), 'date');

    const onedayPlus = 1000 * 60 * 60 * 24;

    const datePlusOneDay = new Date(new Date(date).getTime() + onedayPlus).toISOString();

    let startInterval = new Date(date)

    startInterval = startInterval.toISOString().split('.000Z')[0]

    console.log(startInterval, 'startInterval');


    let endInterval = new Date(datePlusOneDay)

    endInterval = endInterval.toISOString().split('.000Z')[0]


    const today = new Date(new Date().toISOString().split('T')[0]).getTime();

    const departureDate = new Date(date).getTime();

    // depature date is between the date and the date + 2 day

    console.log(today, 'today');


    const deltaTime = today - departureDate;

    let flights;

    console.log(deltaTime, 'deltaTime');

    console.log(departureDate, 'departureDate');

    console.log(departureDate > today, 'departureDate > today');

    console.log(deltaTime > 1000 * 60 * 60 * 24 * 2, 'deltaTime > 1000 * 60 * 60 * 24 * 2');



    if (deltaTime < 1000 * 60 * 60 * 24 * 2 || departureDate > today) {

        console.log('searching in unsaved flights');


        flights = await searchUnsavedFlights(
            {
                depDate: date,
                depAir: depairp,
                flightNumber: flightnum,
                airlineCode: airlinecode
            }
        )

        flights = [flights];

        console.log(flights, 'flight from UNSAVED flights resarch');


    } else {

        flights = Flight.find({
            'depAirport': departureAirport._id,
            'depDate': {
                $gte: startInterval,
                $lt: endInterval
            },
            $or: [
                {
                    'carrierAirline': airline._id,
                    'carrierFlightNumber': flightnum
                },
                {
                    $and: [
                        {
                            'codesharesAirlines': {
                                $in: [airline._id]
                            },
                            'codesharesNumbers': {
                                $in: [flightnum]
                            }
                        }
                    ]
                }
            ]
        }).populate('depAirport')
            .populate('arrAirport')
            .populate('carrierAirline')
            .populate('codesharesAirlines')

        flights = await flights;
    }



    // query.select("-codesharesAirlines -codesharesNumbers")



    console.log(flights, 'flights FROM FLIGHTS/CONTROLLER LINE 309');





    console.log("select is just to running")

    // query.select('-codesharesAirlines -codesharesNumbers')

    console.log("select has been operated");






    if (!flights) {
        return res.status(404).json({
            message: "Flight not found"
        })
    }


    if (flights.length === 1 && diagnosticBool) {


        const arrivalAirport = await Airport.findById(flights[0].arrAirport);
        console.log(flights[0].depDate, 'flights[0].depDate')
        console.log(flights[0].arrDate, 'flights[0].arrDate');

        const diagnostic = await diagnosticFunction(depairp, flights[0].depDate, arrivalAirport.iata, flights[0].arrDate);

        return res.status(200).json({
            message: "ok",
            flightsLen: flights.length,
            flights: flights.length < 50 ? flights : flights.slice(0, 50),
            diagnostic
        })

    }

    res.status(200).json({
        message: "ok",
        flightsLen: flights.length,
        flights: flights.length < 50 ? flights : flights.slice(0, 50),


    })


}



const getStatisticOfDepartureFlightsForAnAiport = async (req, res) => {

    const { airportCode } = req.query;

    const airport = await Airport.findOne({
        $or: [
            { iata: airportCode },
            { fs: airportCode },
            { icao: airportCode }
        ]
    });

    const stats = await Flight.aggregate([
        {
            $match: {
                $or: [{ 'depAirport': airport._id }]
            }
        },
        // now i want that the groups are made by the date from 1st july 2024 and 17th agust 2024
        // the problem is that depDate is a iso string date and i want to convert to only date 
        // and set it as id of the group
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$depDate" } },
                // add avarageDepartureDelay 
                avarageDepartureDelay: { $avg: "$departureDelay" },
                // add maximum departure delay
                maxDepartureDelay: { $max: "$departureDelay" },
                // add minimum departure delay
                minDepartureDelay: { $min: "$departureDelay" },
                // add awarageOfProblemaicFlights (departureDelay > 60 or cancelled)
                avarageOfProblemaicFlights: { $avg: { $cond: { if: { $or: [{ $gte: ["$departureDelay", 60] }, { $eq: ["$finalStatus", "Cancelled"] }] }, then: 1, else: 0 } } },
                totalFlights: { $sum: 1 },
                totalCancelledFlights: { $sum: { $cond: { if: { $eq: ["$finalStatus", "Cancelled"] }, then: 1, else: 0 } } },
                totalDelayedFlights: { $sum: { $cond: { if: { $gte: ["$departureDelay", 150] }, then: 1, else: 0 } } }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }

    ])

    res.status(200).json({
        message: "ok",
        stats
    })

}

// do the same for arrival flights on an airport

const getStatisticOfArrivalFlightsForAnAiport = async (req, res) => {

    const { airportCode } = req.query;

    const airport = await Airport.findOne({
        $or: [
            { iata: airportCode },
            { fs: airportCode },
            { icao: airportCode }
        ]
    });

    const stats = await Flight.aggregate([
        {
            $match: {
                $or: [{ 'arrAirport': airport._id }]
            }
        },
        // now i want that the groups are made by the date from 1st july 2024 and 17th agust 2024
        // the problem is that depDate is a iso string date and i want to convert to only date 
        // and set it as id of the group
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$arrDate" } },
                // add avarageDepartureDelay 
                avarageArrivalDelay: { $avg: "$arrivalDelay" },
                // add maximum departure delay
                maxArrivalDelay: { $max: "$arrivalDelay" },
                // add minimum departure delay
                minArrivalDelay: { $min: "$arrivalDelay" },
                // add awarageOfProblemaicFlights (departureDelay > 60 or cancelled)
                avarageOfProblemaicFlights: { $avg: { $cond: { if: { $or: [{ $gte: ["$arrivalDelay", 60] }, { $eq: ["$finalStatus", "Cancelled"] }] }, then: 1, else: 0 } } },
                totalFlights: { $sum: 1 },
                totalCancelledFlights: { $sum: { $cond: { if: { $eq: ["$finalStatus", "Cancelled"] }, then: 1, else: 0 } } },
                totalDelayedFlights: { $sum: { $cond: { if: { $gte: ["$arrivalDelay", 150] }, then: 1, else: 0 } } }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }

    ])

    res.status(200).json({
        message: "ok",
        stats
    })

}

// function that do the same that we did above but with airline company code 
// as filter, so return for any date the statistic of the flights of that airline
// in that date giving back the avarage delay, the maximum delay, the minimum delay
// the avarage of problematic flights (delay > 60 or cancelled) and the total flights
// the total cancelled flights and the total delayed flights (delay > 100)

const getStatisticOfFlightsForAnAirline = async (req, res) => {

    const { airlineCode } = req.query;

    const airline = await Airline.findOne({
        $or: [
            { iata: airlineCode },
            { fs: airlineCode },
            { icao: airlineCode },

        ]
    });

    const stats = await Flight.aggregate([
        {
            // $match: {
            //     $or: [{ 'carrierAirline': airline._id }]
            // }
            // the match bust be with flights carrierAirline equal to the airline id
            // or airline id bust be included in codesharesAirlines using in operator
            $match: {
                $or: [
                    { 'carrierAirline': airline._id },
                    {
                        'codesharesAirlines': {
                            $in: [airline._id]
                        }
                    }
                ]
            }


        },
        // now i want that the groups are made by the date from 1st july 2024 and 17th agust 2024
        // the problem is that depDate is a iso string date and i want to convert to only date 
        // and set it as id of the group
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$depDate" } },
                // add avarageDepartureDelay 
                avarageDepartureDelay: { $avg: "$departureDelay" },
                // add maximum departure delay
                maxDepartureDelay: { $max: "$departureDelay" },
                // add minimum departure delay
                minDepartureDelay: { $min: "$departureDelay" },
                // add awarageOfProblemaicFlights (departureDelay > 30 or cancelled)
                avarageOfProblemaicFlights: { $avg: { $cond: { if: { $or: [{ $gte: ["$departureDelay", 60] }, { $eq: ["$finalStatus", "Cancelled"] }] }, then: 1, else: 0 } } },
                totalFlights: { $sum: 1 },
                totalCancelledFlights: { $sum: { $cond: { if: { $eq: ["$finalStatus", "Cancelled"] }, then: 1, else: 0 } } },
                totalDelayedFlights: { $sum: { $cond: { if: { $gte: ["$departureDelay", 120] }, then: 1, else: 0 } } }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }

    ])

    res.status(200).json({
        message: "ok",
        airlineName: airline.name,
        stats,
    })

}

const getFlightBySlug = async (req, res) => {

    const { slug } = req.body;

    console.log(slug, 'slug');


    let flight = await Flight.findOne({
        slug
    }).populate('depAirport')
        .populate('arrAirport')
        .populate('carrierAirline')
        .populate('codesharesAirlines')
    if (!flight) {

        return res.status(404).json({
            message: "Flight not found"
        })
    }

    console.log(flight, 'flight');


    res.status(200).json({
        message: "ok",
        flight
    })
}


module.exports = {
    getFlights,
    getStatisticOfDepartureFlightsForAnAiport,
    getStatisticOfArrivalFlightsForAnAiport,
    getStatisticOfFlightsForAnAirline,
    getFlightBySlug,
    diagnosticRequest
};