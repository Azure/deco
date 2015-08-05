import Ember from 'ember';
import Settings from '../models/settings';

/**
 * Ember's application controller.
 * @param {Account record} activeConnection - The currently active connection
 */
export default Ember.Controller.extend({
    fs: Ember.computed.alias('nodeServices.fs'),
    nodeServices: Ember.inject.service(),
    activeConnection: null,
    lastError: '',
    disableTracking: false,
    settings: Settings.create(),

    /**
     * Init function, run on application launch: overrides the default drag & drop behavior
     */
    init: function () {
        this._super();

        window.ondrop = e => { e.preventDefault(); return false; };
        window.ondragover = e => { e.preventDefault(); return false; };

        if (this.get('settings.firstUse')) {
            Ember.run.schedule('afterRender', () => {
                this.send('openFirstUseModal');
            });
            this.set('settings.firstUse', false);
        }

        if (this.get('settings.allowUsageStatistics') !== true) {
            console.log('Disabling anonymized usage tracking');
            this.send('disableAppInsights');
        }
    },

    /**
     * Returns the current version number.
     */
    versionNumber: function () {
        var fs = this.get('fs');
        return fs.existsSync('version') ? fs.readFileSync('version', {encoding:'utf8'}) : 'unknown';
    }.property()
});
