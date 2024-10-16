const mongoose = require('mongoose');

const insightSchema = require('./schema')

const Insight = mongoose.models.Insight || mongoose.model("Insight", insightSchema);

module.exports = Insight;