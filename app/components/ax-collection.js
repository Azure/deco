import Ember from 'ember';

export default Ember.Component.extend({
  content: null,

  didInitAttrs() {
    this._super(...arguments);
    var content = this.get('content');

    if (!content) {
      this.set('content', []);
    }
  },

  actions: {
    select: function (item) {
      console.log(item);
      this.set('selectedValue', item);
      this.sendAction();
    }
  }
});
