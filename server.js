f = function() {
    console.log.apply(this, arguments);
};

var express = require('express');
var basicAuth = require('basic-auth');
var log = require('./server/lib/log');
var config = require('./server/config');
var async = require('async');
var bodyParser = require('body-parser');
var fs = require('fs');
utils = require('./server/lib/utils');
var db = require('./server/lib/db');
var api = require('./server/lib/api');
var bot = require('./server/lib/bot');
var cookieParser = require('cookie-parser');
var extend = require('extend');
var ejs = require('ejs');


// start express
var app = express();
app.set('view engine', 'ejs');
ejs.delimiter = '?';


// configure app
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(bodyParser.json());


app.use(express.static(__dirname + '/public'));





var authControl = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    }

    var user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }
    if (user.name === config.get('control:user') && user.pass === config.get('control:pass')) {
        return next();
    } else {
        return unauthorized(res);
    }
};





app.get('/', authControl, function (req, res) {
    var dt = new utils.DateTime();

    res.render('pages/index', {
        body: {name: '#cводка - ' + dt.formats.compound.mySQL, desc: ''},
        success: req.query.success || '',
        type: req.query.act || 'new'
    });
});

app.get('/list', authControl, function (req, res) {
    db.news.find({}, {}, {sort: {add_ts: -1}}, function (err, list) {
        list.forEach(function(o) {
            var dt = new utils.DateTime(o.add_ts * 1000);
            o.date = dt.formats.compound.mySQL;
        });
        res.render('pages/index', {
            type: 'list',
            list: list
        });
    });
});

app.get('/check', authControl, function (req, res) {
    db.users.find({}, {}, {
        sort: {reg_ts: -1}
    },  function (err, users) {
        res.render('pages/index', {
            type: 'users',
            users: users
        });
    });
});


app.get('/edit', authControl, function (req, res) {
    db.news.findById(req.query.id, function (err, news) {
        res.render('pages/index', {
            body: {name: news.name, desc: news.desc},
            success: req.query.success || '',
            edit: true,
            id: req.query.id,
            type: 'new'
        });
    });
});

app.post('/', authControl, function (req, res) {
    var body = req.body;

    var err = [];
    if (!body.name.length) {
        err.push('Название не забыл, случаем?');
    }
    if (!body.desc.length) {
        err.push('Текст сводки крайне важен — заполни его!');
    }

    if (!err.length) {
        if (body.status == 'draft') {
            db.news.create({
                name: body.name,
                desc: body.desc,
                status: 'draft'
            }, function (err, news) {
                res.redirect('/edit?id=' + news._id + '&success=draft');
            });
        } else {
            db.users.find({subscribe: true, status: true}, {uid: 1}, function (err, users) {
                var send = function (arr) {
                    bot.sendMessage({
                        chat_id: arr.uid,
                        text: body.name + '\n\n' + body.desc
                    }, function (err, datas) {
                        if (users.length) {
                            send(users.shift());
                        } else {
                            db.news.create({
                                name: body.name,
                                desc: body.desc,
                                status: 'sent'
                            }, function (err, news) {
                                res.redirect('/?success=sent');
                            });
                        }
                    });
                };
                send(users.shift());
            });
        }
    } else {
        res.render('pages/index', {
            err: err,
            body: body,
            success: false,
            type: req.query.act || 'new'
        });
    }
});

app.post('/edit', authControl, function (req, res) {
    var body = req.body;

    var err = [];
    if (!body.name.length) {
        err.push('Название не забыл, случаем?');
    }
    if (!body.desc.length) {
        err.push('Текст сводки крайне важен — заполни его!');
    }

    if (!err.length) {
        if (body.status == 'draft') {
            db.news.findOneAndUpdate({_id: req.query.id}, {
                name: body.name,
                desc: body.desc,
                edit_ts: utils.timestamp(),
                status: 'draft'
            }, function (err, news) {
                res.redirect('/edit?id=' + news._id + '&success=draft');
            });
        } else {
            db.users.find({subscribe: true, status: true}, {uid: 1}, function (err, users) {
                var send = function (arr) {
                    bot.sendMessage({
                        chat_id: arr.uid,
                        text: body.name + '\n\n' + body.desc
                    }, function () {
                        if (users.length) {
                            send(users.shift());
                        } else {
                            db.news.findOneAndUpdate({_id: req.query.id}, {
                                name: body.name,
                                desc: body.desc,
                                edit_ts: utils.timestamp(),
                                status: 'sent'
                            }, function (err, news) {
                                res.redirect('/?success=sent');
                            });
                        }
                    });
                };
                send(users.shift());
            });
        }
    } else {
        res.render('pages/index', {
            err: err,
            body: body,
            edit: true,
            id: req.query.id,
            success: false,
            type: req.query.act || 'new'
        });
    }
});

app.post('/change_status', authControl, function(req, res) {
    if (req.body.id && req.body.status) {
        db.users.findOneAndUpdate({_id: req.body.id}, {
            status: req.body.status == 'false' ? false : true
        }, function (err, user) {
            res.json(api.res('STATUS_CHANGED'));
        })
    } else {
        res.json(api.error(400, 'DATA_INVALID'));
    }
});



app.use(function (err, req, res, next) {
    console.log(err.stack);
    if (app.get('env') == 'development') {
        res.send(500, '<pre>' + err.stack + '</pre>');
    } else {
        res.json(500, api.error(500, 'INTERNAL_SERVER_ERROR'));
    }
});

app.listen(config.get('port'));
f('Magic happens on port ' + config.get('port'));