define(function () {
    'use strict';

    var _socket;

    function init (dfd) {
        _socket = window.io.connect();
        _socket.on('connect', function () {
            console.log('Socket is now connected.');
            dfd.resolve();
        });
    }

    function getInstance () {
        if (_socket) {
            return _socket;
        }
        throw 'Socket has not been initialized.';
    }

    function postAction (action) {
        _socket.post('/game/action', action, function (response) {

        });
    }

    function listenTo (type, callback) {
        _socket.on(type, callback);
    }

    return {
        init        : init,
        getInstance : getInstance,
        postAction  : postAction,
        listenTo    : listenTo
    };
});
