const winston = require('winston');
const colors = require('colors');
const settings = require('../../settings');
const axios = require('axios');

class DiscordWebhookTransport extends winston.Transport {
  constructor(options) {
    super(options);
    this.webhookUrl = options.webhookUrl;
  }

  async log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    // Formatting the log message
    const logMessage = `[${info.level.toUpperCase()}] ${info.timestamp} - ${info.message}`;

    try {
      // Sending the log message to the Discord webhook
      await axios.post(this.webhookUrl, { content: logMessage });
    } catch (error) {
      console.error('Error sending log to Discord webhook:', error.message);
    }

    callback();
  }
}

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

  if (settings.logs.discord.enabled) {
    log.add(
      new DiscordWebhookTransport({
        level: 'info',
        webhookUrl: settings.logs.discord.webhook
      })
    );
  }


module.exports = log;