// load aws sdk
var aws = require('aws-sdk');

// load aws config
aws.config.loadFromPath(__dirname + '/config.json');

// load AWS SES
var ses = new aws.SES({apiVersion: '2010-12-01'});

// send to list


// this must relate to a verified SES account
var from = 'Highfeed Video <admin@uweb.ws>';


// this sends the email
// @todo - add HTML version
function send(to, head, message, reply, callback) {
    callback = callback || function () {};
    ses.sendEmail({
            Source: 'Highfeed Video <' + reply + '>',
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: {
                    Data: head
                },
                Body: {
                    Html: {
                        Data: message
                    }
                }
            }
        }, function (err, data) {
            if (err) {
                callback('ERROR_SEND_MAIL');
            } else {
                callback(null);
            }
        }
    );

}

module.exports = send;