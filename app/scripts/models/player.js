define(['vendor/backbone', 'resolverFactory'], function (Backbone, resolverFactory) {
    'use strict';

    var Player = Backbone.Model.extend({

        MODE: {
            HUMAN: 'human',
            COMPUTER: 'computer'
        },

        defaults: {
            _id: 1,
            mode: this.MODE.HUMAN,
            nickname: undefined,
            rank: undefined,
            score: undefined,

            uid: undefined,
            sex: undefined,
            country: undefined
        },

        initialize: function (options) {
            this.set('resolver', resolverFactory.getResolver(this.get('mode')));
        }

    });

    return Player;
});