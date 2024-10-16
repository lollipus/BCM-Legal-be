const { Insight } = require('../../DB/app-db/models');



const getAllInsights = async (req, res) => {

    console.log('collecting insights');

    console.log(Insight, 'Insight from getAllInsights');



    try {
        const insights = await Insight.find({});
        console.log(insights);

        res.status(200).json({
            status: 'success',
            data: insights
        });
    } catch (error) {
        console.log(error, 'error from getAllInsights');

        res.status(404).json({ message: error.message });
    }
}

const getInsightDetails = async (req, res) => {
    try {
        const insight = await Insight.findById(req.params.insight_id);
        res.status(200).json({
            status: 'success',
            data: insight
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


// add one insight

const addInsight = async (req, res) => {



    console.log(req.originalUrl, 'req.body from addInsight');


    const insight = req.body;

    console.log(insight, 'insight from addInsight');


    const newInsight = new Insight(insight);

    try {
        await newInsight.save();
        res.status(201).json({
            status: 'success',
            data: newInsight
        });
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}


module.exports = { getAllInsights, getInsightDetails, addInsight };
