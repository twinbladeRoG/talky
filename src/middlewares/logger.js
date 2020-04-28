const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const moment = require('moment');
const chalk = require('chalk');

const logFormat = printf(({ level, message, timestamp }) => {
  level = level.toUpperCase();
  let loglevel = '';

  switch (level) {
  case 'ERROR':
    loglevel = chalk.black.bgRed(` ${level} `);
    break;
  case 'WARN':
    loglevel = chalk.black.bgYellow(` ${level} `);
    break;
  case 'INFO':
    loglevel = chalk.black.bgBlue(` ${level} `);
    break;
  case 'HTTP':
    loglevel = chalk.black.bgGreen(` ${level} `);
    break;
  case 'VERBOSE':
    loglevel = chalk.black.bgMagenta(` ${level} `);
    break;
  case 'DEBUG':
    loglevel = chalk.black.bgYellowBright(` ${level} `);
    break;
  default:
    loglevel = ` ${level} `;
    break;
  }

  timestamp = moment(timestamp).format('DD-MMM-YYYY HH:mm:ss ZZ');
  timestamp = chalk.greenBright(`[${timestamp}]`);
  return `${timestamp} ${loglevel} ${message}`;
});

const options = {
  file: {
    level: 'info',
    filename: 'logs/app.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    timestamp,
    format: combine(logFormat)
  }
};

const logger = new createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console)
  ],
  exitOnError: false // do not exit on handled exceptions
});

logger.stream = {
  write: function(message) {
    logger.info(message);
  }
};

module.exports = logger;
