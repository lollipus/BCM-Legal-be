const { Airport } = require('../../DB/flights-db/models');

const getAirports = async (req, res) => {

    console.log('Airport checking...');

    console.log(Airport, 'Airport from getAirports');


    try {
        const airports = await Airport.find();
        res.status(200).json({
            status: 'success',
            data: airports
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}



module.exports = { getAirports };