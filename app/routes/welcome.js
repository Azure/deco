import Ember from 'ember';

export default Ember.Route.extend({
    model: function () {
        return this.store.find('account');
    },

    resetController: function (controller, isExiting) {
        if (isExiting) {
            controller.set('loading', false);
            controller.set('addNewUi', false);
            controller.set('editUi', false);
            controller.send('selectize');
        }
    },

    actions: {
        selectize: function () {
            Ember.run.scheduleOnce('afterRender', this, function () {
                Ember.$('select').material_select();
            });
        }
    }
});
