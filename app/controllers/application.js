import Ember from 'ember';
import config from '../config/environment';

/**
 * Ember's application controller.
 * @param {Account record} activeConnection - The currently active connection
 */
export default Ember.Controller.extend({
    nodeServices: Ember.inject.service(),
    application: Ember.inject.service(),
    versionNumber: Ember.computed.alias('application.versionNumber'),
    /**
     * Init function, run on application launch: overrides the default drag & drop behavior
     */
    init: function () {
        this._super();

        window.ondrop = e => { e.preventDefault(); return false; };
        window.ondragover = e => { e.preventDefault(); return false; };

        if (config.environment === 'test') {
            return;
        }

        if (this.get('application.settings.firstUse')) {
            Ember.run.schedule('afterRender', () => {
                this.send('openFirstUseModal');
            });
            this.set('application.settings.firstUse', false);
        }

        if (this.get('application.settings.allowUsageStatistics') !== true) {
            console.log('Disabling anonymized usage tracking');
            this.send('disableAppInsights');
        }
    }
});
