const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.code || 500).json({ message: err.message });
  next();
};

module.exports = errorHandler;
