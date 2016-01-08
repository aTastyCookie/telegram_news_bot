var telegram = require('telegram-bot-api');
var db = require(__dirname + '/db');
var async = require('async');


var api = new telegram({
    token: 'token',
    updates: {
        enabled: true,
        get_interval: 200
    }
});


api.on('message', function (obj) {

    f(obj);

    var chatID = obj.chat.id;
    var userID = obj.from.id;


    if ('new_chat_participant' in obj) {
        async.waterfall([
            // register chat
            function (callback) {
                db.users.findOne({uid: chatID, type: 'chat'}, callback);
            },
            function (user, callback) {
                if (user) {
                    db.users.findOneAndUpdate({uid: chatID, type: 'chat'}, {subscribe: true}, function (err, user) {
                        callback(null, user);
                    });
                } else {
                    db.users.create({
                        uid: chatID,
                        type: 'chat',
                        first_name: obj.chat.title
                    }, callback);
                }
            }
        ], function (err, result) {

        });
    } else if ('left_chat_participant' in obj) {
        db.users.findOneAndUpdate({uid: chatID, type: 'chat'}, {subscribe: false}, function (err, user) {

        });
    }


    if (!('text' in obj)) {
        return false;
    } else {
        var t = obj.text;
    }
    async.waterfall([
        // register user
        function (callback) {
            db.users.findOne({uid: obj.from.id, type: 'user'}, callback);
        },
        function (user, callback) {
            if (user) {
                callback(null, user);
            } else {
                db.users.create({
                    uid: obj.from.id,
                    first_name: obj.from.first_name,
                    last_name: obj.from.last_name,
                    username: obj.from.username
                }, callback);
            }
        },
        function (user, callback) {
            // subscribe
            if (t == '/start') {
                db.users.findOneAndUpdate({uid: userID}, {subscribe: true}, function (err, user) {
                    api.sendMessage({
                        chat_id: userID,
                        text: 'Теперь тебе будут падать сводки по мере их появления. Для более подробной информации отправь /help',
                        reply_markup: JSON.stringify({
                            hide_keyboard: true
                        })
                    });
                });
            }
//            // stop subscribe
//            if (t == '/stop') {
//                db.users.findOneAndUpdate({uid: userID}, {subscribe: false}, function (err, user) {
//                    api.sendMessage({
//                        chat_id: userID,
//                        text: 'Вы отписаны. Чтобы подписаться нажмите /start',
//                        reply_markup: JSON.stringify({
//                            hide_keyboard: true
//                        })
//                    });
//                });
//            }

            if (t == '/latest') {
                api.sendMessage({
                    chat_id: userID,
                    text: 'Выберите количество последних новостей',
                    reply_markup: JSON.stringify({
                        resize_keyboard: true,
                        keyboard: [
                            ['1'],
                            ['5'],
                            ['10']
                        ]
                    })
                });
            }

            // latest
            var latestNUM = 0;
            if (latestNUM = t.match(/^([1|5|10]+)$/)) {
                db.news.find({status: 'sent'}, {}, {
                    skip: 0,
                    limit: latestNUM[1],
                    sort: {
                        add_ts: -1
                    }
                }, function (err, data) {
                    if (data.length) {
                        data = data.reverse();
                        var send = function (arr) {
                            api.sendMessage({
                                chat_id: userID,
                                text: arr.name + '\n\n' + arr.desc,
                                reply_markup: JSON.stringify({
                                    hide_keyboard: true
                                })
                            }, function () {
                                if (data.length) {
                                    send(data.shift());
                                }
                            });
                        };
                        send(data.shift());
                    }
                });
            }

            if (t == '/history') {
                db.news.find({status: 'sent'}, {}, {
                    skip: 0,
                    limit: 20,
                    sort: {
                        add_ts: -1
                    }
                }, function (err, data) {
                    if (data.length) {
                        var arr = [];
                        data.forEach(function (o) {
                            arr.push([o.name]);
                        });
                        api.sendMessage({
                            chat_id: userID,
                            text: 'Список сводок',
                            reply_markup: JSON.stringify({
                                resize_keyboard: true,
                                keyboard: arr
                            })
                        });
                    }
                });
            }

            if (t == '/help') {
                api.sendMessage({
                    chat_id: userID,
                    text: 'В боте доступны функции:\n\n/history - История сводок\n/latest - Получить 1, 5 или 10 ' +
                        'последних сводок\n/help - Помощь по боту и некоторые другие новости',
                    reply_markup: JSON.stringify({
                        hide_keyboard: true
                    })
                });
            }


            if (t.substr(0, 1) != '/' && t.length > 2) {
                db.news.findOne({name: t}, {}, {
                    skip: 0,
                    limit: 1,
                    sort: {
                        add_ts: -1
                    }
                }, function (err, data) {
                    if (!err && data) {
                        api.sendMessage({
                            chat_id: userID,
                            text: data.name + '\n\n' + data.desc,
                            reply_markup: JSON.stringify({
                                hide_keyboard: true
                            })
                        });
                    } else {
                        f(err);
                    }
                });
            }
        }
    ], function (err, result) {
        f(err);
    });
});

module.exports = api;
