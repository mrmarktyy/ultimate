define(['vendor/backbone'], function (Backbone) {

    var Cell = Backbone.Model.extend({

        defaults: {
            value: 0
        },

        initialize: function (options) {
            // this.set(options);
            console.log('new cell');
        }

    });


    return Cell;
});
