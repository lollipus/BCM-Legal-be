const dotenv = require('dotenv');

dotenv.config({});

const mongoose = require('mongoose');

const DB_APP = process.env.DATABASE_ATLAS.replace('PASSWORD', process.env.ATLAS_PASS);

// const DB_FLIGHTS = process.env.DATABASE_LOCAL //.replace('<PASSWORD>', process.env.DIGITAL_OCEAN_DB_PASSWORD);

const DB_FLIGHTS = process.env.DIGITAL_OCEAN_DB.replace('<PASSWORD>', process.env.DIGITAL_OCEAN_DB_PASSWORD);



const connectDBs = () => {

    try {

        const mongooseOptions = {
            useUnifiedTopology: true,
        };

        const dbApp = mongoose.createConnection(DB_APP, {})

        const dbFlight = mongoose.createConnection(DB_FLIGHTS, {})

        return { dbApp, dbFlight };

    } catch (err) {
        console.log(err);


    }

}

module.exports = connectDBs

