const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({

    // The title of the insight
    title: {
        type: String,
        required: true
    },
    incipit: {
        type: String,
        required: true
    },
    subTitles: {
        type: [String],
        required: false
    },
    // The content of the insight
    paragraphs: {
        type: [String],
        required: true
    },
    author: {
        type: String,
        required: false
    },
    tags: {
        type: [String],
        required: true
    },
    img: {
        type: String,
        required: false
    }
}, { timestamps: true });


module.exports = insightSchema;