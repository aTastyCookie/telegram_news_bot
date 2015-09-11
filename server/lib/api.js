var api = {};

api.errorObj = {
    error: {
        code: 500,
        msg: 'UNKNOW_ERROR'
    }
};

api.resObj = {
    response: []
};

api.error = function () {
    if (arguments.length == 1) {
        api.errorObj.error.msg = arguments[0];
        api.errorObj.error.code = 500;
    } else if (arguments.length == 2) {
        api.errorObj.error.code = arguments[0];
        api.errorObj.error.msg = arguments[1];
    }
    return api.errorObj;
};

api.res = function () {
    if (arguments.length) {
        api.resObj.response = arguments[0];
    }
    return api.resObj;
};

module.exports = api;