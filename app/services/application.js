import Ember from 'ember';
import Settings from '../models/settings';

export default Ember.Service.extend({
    nodeServices: Ember.inject.service(),
    notifications: Ember.inject.service(),
    fs: Ember.computed.alias('nodeServices.fs'),
    path: Ember.computed.alias('nodeServices.path'),
    activeConnection: null,
    serviceSettings: null,
    lastError: '',
    disableTracking: false,
    settings: Settings.create(),

    /**
     * Returns the current application version number.
     */
    versionNumber: function () {
        var fs = this.get('fs'),
            path = this.get('path'),
            versionFile = path.join(path.join(__dirname, 'version'));
        return fs.existsSync(versionFile) ? fs.readFileSync(versionFile, {encoding:'utf8'}) : 'unknown';
    }.property()
});
