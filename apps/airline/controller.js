const { Airline } = require('../../DB/flights-db/models')

const getAirlines = async (req, res) => {

    console.log('Airline checking...');

    try {
        const airlines = await Airline.find();
        res.status(200).json({
            status: 'success',
            data: airlines
        });
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
}

module.exports = { getAirlines };

