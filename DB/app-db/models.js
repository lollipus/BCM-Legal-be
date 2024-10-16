const mongoose = require('mongoose');

const connectDBs = require('../dbs')

const { dbApp } = connectDBs()

const insightSchema = require('../../apps/insight/schema')

const Insight = dbApp.model('Insight', insightSchema);

module.exports = { Insight }