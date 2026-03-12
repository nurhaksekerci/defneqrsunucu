const aggregation = require('../services/aggregation');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await aggregation.getDashboardStats(req);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getDashboardData = async (req, res, next) => {
  try {
    const result = await aggregation.getDashboardData(req);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
