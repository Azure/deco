import Ember from 'ember';

var azureStorage = null,
    fs = null,
    path = null;

/**
 * Check if running in nw, if not, we're probably running as a test,
 * in which case this entire service will be mocked
 */
if (window.requireNode) {
    azureStorage = window.requireNode('azure-storage');
    fs = window.requireNode('fs');
    path = window.requireNode('path');
}

/**
 * Allow the injection of Node Modules as Ember Services
 */
export default Ember.Service.extend({
    azureStorage: azureStorage,
    fs: fs,
    path: path,

    /**
     * Get the currently active account
     * @param  {DS.Store} store
     * @return {Promise}
     */
    getActiveAccount: function (store) {
        return new Ember.RSVP.Promise(function (resolve, reject) {
            var accounts = store.peekAll('account'),
                length = accounts.get('length'),
                i = 0;

            accounts.forEach(function (account) {
                if (account.get('active') === true) {
                    return Ember.run(null, resolve, account);
                }
                i += 1;
                if (i >= length) {
                    return Ember.run(null, reject, 'could not find any active accounts');
                }
            });
        });
    }
});
