import Ember from 'ember';

export default Ember.Route.extend({

    model: function () {
        return this.store.find('container');
    },

    actions: {
        refresh: function () {
          return this.refresh();
        }
    }
});
