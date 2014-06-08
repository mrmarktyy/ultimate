define(['vendor/lodash', 'vendor/jquery', 'resolvers/resolver', 'utils/socket'], function (_, $, Resolver, Socket) {
    'use strict';

    var OnlineResolver = Resolver.extend({

        init: function () {
            Socket.listenTo('move', _.bind(this.moveListener, this));
        },

        getNextMove: function (lastMove, validSquares) {
            this.deferred = new $.Deferred();

            return this.deferred.promise();
        },

        moveListener: function (response) {
            this.deferred.resolve({
                _squareIndex: response.square,
                _cellIndex: response.cell
            });
        }

    });

    return OnlineResolver;
});
