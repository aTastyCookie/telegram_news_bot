var config = require('../config');
var PushBullet = require('pushbullet');
var pusher = new PushBullet(config.get('pushbullet'));

module.exports = pusher;