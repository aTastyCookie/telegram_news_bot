var winston = require('winston');

var log = {};

log.get = function (module) {
    var path = module.filename.split('/').slice(-2).join('/'); //отобразим метку с именем файла, который выводит сообщение

    return new winston.Logger({
        transports : [
            new winston.transports.Console({
                colorize:   true,
                level:      'debug',
                label:      path
            })
        ]
    });
};

/*log.sms = function () {
    return new winston.Logger({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: './logs/sms.log'})
        ]
    });
};*/

log.db = function () {
    return new winston.Logger({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: './server/logs/db.log'})
        ]
    });
};

module.exports = log;