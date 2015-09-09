import Ember from 'ember';
import contextMenu from '../utils/context-menu';
import windowMenu from '../utils/window-menu';
import Settings from '../models/settings';
import stringResources from '../utils/string-resources';

/**
 * Ember Application Route
 */
export default Ember.Route.extend({
    settings: Settings.create(),

    /**
     * Setup the context menu and Materialize's dumb <select>,
     * then transition to the welcome screen
     */
    beforeModel: function () {
        Ember.run.scheduleOnce('afterRender', this, function () {
            Ember.$('select').material_select();
            contextMenu.setup();
            windowMenu.setup();
        });

        this.transitionTo('welcome');
    },

    actions: {
        /**
         * Open the modal containing "first use" info
         */
        openFirstUseModal: function () {
            Ember.$('#modal-firstuse').openModal();
        },

        /**
         * Open the modal containing error information
         */
        openErrorModal: function () {
            Ember.$('#modal-error').openModal();
        },

         /**
         * Close the modal containing error information
         */
        closeErrorModal: function () {
            Ember.$('#modal-error').closeModal({ out_duration: 250 });
            // added this explicit wait for testing purposes only
            Ember.run.later(null, function () {}, 300);
        },

        /**
         * Enable or disable usage statistics (anonymized)
         */
        toggleUsageStatistics: function (track) {
            this.set('settings.allowUsageStatistics', track);

            if (!track) {
                this.send('disableAppInsights');
            }
        },

        /**
         * Disable usage statistics by overwriting the
         * window.appInsights object
         */
        disableAppInsights: function () {
            if (window.appInsights) {
                window.appInsights = {
                    trackEvent: function () { return; },
                    trackException: function () { return; },
                    trackPageView: function () { return; },
                    trackTrace: function () { return; },
                    trackMetric: function () { return; }
                };
            }
        },

        /**
         * Handle various errors during route transitions
         */
        error: function (error, transition) {
            if (error) {
                let welcomeController = this.controllerFor('welcome');

                welcomeController.set('loading', false);
                welcomeController.set('addNewUi', false);
                welcomeController.set('editUi', false);

                var storageDnsSuffix = '';
                if (error.host) {
                    storageDnsSuffix = error.host;
                } else {
                    storageDnsSuffix = 'blob.core.windows.net';
                }

                if (error.code && (error.code === 'ENOTFOUND' || error.code === 'OutOfRangeInput')) {
                    // Please check the DNS suffix is correct (leaving it blank will default to core.windows.net)')
                    this.controller.set('lastError', stringResources.storageHostConnectionErrorMessage(storageDnsSuffix));
                } else if (error.code && error.code === 'AuthenticationFailed') {
                    this.controller.set('lastError', stringResources.storageRejectedAccountKey());
                } else if (error.message && error.message.indexOf('is not a valid base64 string') > -1) {
                    this.controller.set('lastError', stringResources.storageInvalidAccountKey());
                } else {
                    this.controller.set('lastError', error);
                }

                console.log(error);

                if (transition) {
                    transition.abort();
                }

                this.send('openErrorModal');

                appInsights.trackException(error);
            }
        }
    }
});
