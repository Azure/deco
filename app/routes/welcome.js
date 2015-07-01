import Ember from 'ember';

export default Ember.Route.extend({
    model: function () {
        return this.store.find('account');
    },

    actions: {
        selectize: function () {
            Ember.run.scheduleOnce('afterRender', this, function () {
                Ember.$('select').material_select();
            });
        }
    }
});
