const log4js = require('log4js');
const config = require('../../config/log4js.config.js');
const levels = require('log4js/lib/levels.js')().levels;

log4js.configure(config);

const console = log4js.getLogger();

const system = log4js.getLogger('system');

const ApplicationLogger = function () {
  this.logger = log4js.getLogger('application');
};

const proto = ApplicationLogger.prototype;

for (let level of levels) {
  level = level.toLowerCase();
  proto[level] = (function (level) {
    return function (key, message) {
      const logger = this.logger;
      logger.addContext('key', key);
      logger[level](message);
    };
  })(level);
}

const application = new ApplicationLogger();

const access = log4js.getLogger('access');

module.exports = {
  console,
  system,
  application,
  access
};