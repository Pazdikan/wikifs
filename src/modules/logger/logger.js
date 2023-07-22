const winston = require('winston');
const colors = require('colors');

const log = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.colorize(), 
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.ms'}), 
      winston.format.printf(({ level, message, timestamp }) => {

        return `${colors.gray(timestamp)} ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console({level: 'silly'}),
      new winston.transports.File({ filename: 'current.log', level: 'http', }),
    ],
  });



module.exports = log;