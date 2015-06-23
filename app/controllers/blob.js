import Ember from 'ember';
import filesize from '../utils/filesize';

export default Ember.Controller.extend({
    prettySize: function () {
        var size = this.get('model.size');
        return filesize(parseInt(size)).human('si');
    }.property('model.size')
});
