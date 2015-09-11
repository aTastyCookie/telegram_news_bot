var mongoose     = require('mongoose');
var config       = require('../config/');
var Schema       = mongoose.Schema;

mongoose.connect(config.get('mongoose:uri'), config.get('mongoose:options'));



var news   = new Schema({
    name: String,
    desc: String,
    add_ts: {
        type: Number,
        default: utils.timestamp
    },
    edit_ts: Number,
    status: String
}, {versionKey: false});

var users = new (mongoose.Schema)({
    uid: {type: Number, unique: true},
    first_name: String,
    last_name: String,
    type: {
        type: String,
        default: 'user'
    },
    username: String,
    reg_ts: {type: Number, default: utils.timestamp},
    subscribe: {
        type: Boolean,
        default: true
    },
    status: {
        type: Boolean,
        default: false
    }
}, {versionKey: false});

module.exports = {
    news: mongoose.model('news', news),
    users:  mongoose.model('user', users)
};