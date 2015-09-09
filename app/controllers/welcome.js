import Ember from 'ember';
import config from '../config/environment';

/**
 * The controller for the welcome view - controlling the creation/addition/connection of and
 * with accounts.
 */
export default Ember.Controller.extend({
    application: Ember.inject.service(),
    activeConnection: Ember.computed.alias('application.activeConnection'),
    loading: false,

    /**
     * If the model is changed, we check if there's reason to go straight to
     * the "add a new account" UI
     */
    setup: function () {
        var model = this.get('model');
        if (!model || !model.content || model.content.length < 1) {
            this.set('addNewUi', true);
        }
    }.observes('model'),

    /**
     * If the user selects an account for editing, we're
     * updating the name & key field with the right data
     */
    editAccountObserver: function () {
        var editAccount = this.get('selectedEditAccount');

        this.store.find('account', editAccount).then(result => {
            if (result) {
                this.set('editAccountName', result.get('name'));
                this.set('editAccountKey', result.get('key'));
                this.set('editAccountDnsSuffix', result.get('dnsSuffix'));
            }
        });
    }.observes('selectedEditAccount'),

    actions: {
        /**
         * Show the "Add New Account" UI
         */
        toggleAddNew: function () {
            if (!this.get('model').content || this.get('model').content.length < 1) {
                return this.set('addNewUi', true);
            }

            this.toggleProperty('addNewUi');
            this.send('selectize');

            if (this.get('addNewUi')) {
                appInsights.trackPageView('AddNewAccount');
            }
        },

        /**
         * Show the "Edit Account" UI
         */
        toggleEdit: function () {
            this.toggleProperty('editUi');
            this.set('selectedEditAccount', this.get('selectedAccount'));
            this.send('selectize');

            if (this.get('editUi')) {
                appInsights.trackPageView('EditAccount');
            }
        },

        /**
         * Save data for a changed account and go back to the "Select Account" view
         */
        edit: function () {
            var editAccount = this.get('selectedEditAccount');
            var editAccountName = this.get('editAccountName');
            var editAccountKey = this.get('editAccountKey');
            var editAccountDnsSuffix = this.get('editAccountDnsSuffix');
            if (!editAccountDnsSuffix || editAccountDnsSuffix.length === 0) {
                editAccountDnsSuffix = config.dnsSuffixContent[0];
            }
            this.store.findRecord('account', editAccount).then(result => {
                if (result) {
                    result.set('name', editAccountName);
                    result.set('key', editAccountKey);
                    result.set('dnsSuffix', editAccountDnsSuffix);
                    result.save();
                }

                this.send('toggleEdit');
            });

            // set selection to the current account
            this.set('selectedAccount', this.get('selectedEditAccount'));

            appInsights.trackEvent('EditAccount');
        },

        delete: function () {
            var editAccount = this.get('selectedEditAccount');

            this.store.findRecord('account', editAccount).then(result => {
                if (result) {
                    result.deleteRecord();
                    result.save();
                }

                Ember.run.schedule('destroy', () => {
                    this.store.find('account').then(accounts => {
                        if (!accounts || !accounts.content || accounts.content.length < 1) {
                            this.send('toggleEdit');
                            this.send('toggleAddNew');
                        } else {
                            this.send('toggleEdit');
                        }
                    });
                });
            });

            appInsights.trackEvent('DeleteAccount');
        },

        /**
         * Add a new account and connect to it.
         */
        addNew: function () {
            var name = this.get('account_name');
            var key = this.get('account_key');
            var dnsSuffix = this.get('account_dnsSuffix');
            if (!dnsSuffix || dnsSuffix.length === 0) {
                dnsSuffix = config.dnsSuffixContent[0];
            }

            var newAccount = this.store.createRecord('account', {
                name: name,
                key: key,
                dnsSuffix: dnsSuffix
            });

            newAccount.save();

            this.send('connect', newAccount.get('id'));
            this.set('account_name', '');
            this.set('account_key', '');
            this.set('dnsSuffix', '');

            // set the selected account to what was just added
            this.set('selectedAccount', this.get('account_name'));

            appInsights.trackEvent('AddNewAccount');
        },

        /**
         * Connect to a selected account
         * @param  {string} activeAccountId
         */
        connect: function (activeAccountId) {
            var self = this;

            this.set('loading', true);

            if (!activeAccountId) {
                activeAccountId = this.get('selectedAccount');
            }

            this.store.findAll('account').then(function (accounts) {
                var i,
                account;

                if (accounts && accounts.content && accounts.content.length > 0) {
                    for (i = 0; i < accounts.content.length; i = i + 1) {
                        account = accounts.content[i].record;
                        if (account.id === activeAccountId) {
                            self.set('activeConnection', account);
                            account.set('active', true);
                        } else {
                            account.set('active', false);
                        }
                    }
                }

                self.store.find('serviceSettings', activeAccountId)
                .then(settings => {
                    console.log('break here');
                    self.set('application.serviceSettings', settings);
                    self.transitionToRoute('explorer');
                })
                .catch ((error) => {
                    self.send('error', error);
                })
                .finally(() => {
                    self.set('loading', false);
                });
            });

            appInsights.trackEvent('Connect');
        }
    }
});
