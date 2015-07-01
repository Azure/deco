import Ember from 'ember';

export default Ember.Controller.extend({
    needs: 'application',
    activeConnection: Ember.computed.alias('controllers.application.activeConnection'),
    loading: false,

    setup: function () {
        var model = this.get('model');
        if (!model || !model.content || model.content.length < 1) {
            this.set('addNewUi', true);
        }
    }.observes('model'),

    editAccountObserver: function () {
        var editAccount = this.get('selectedEditAccount');

        this.store.find('account', editAccount).then(result => {
            if (result) {
                this.set('editAccountName', result.get('name'));
                this.set('editAccountKey', result.get('key'));

            }
        });
    }.observes('selectedEditAccount'),

    actions: {
        toggleAddNew: function () {
            this.toggleProperty('addNewUi');
        },

        toggleEdit: function () {
            this.toggleProperty('editUi');
            this.send('selectize');
        },

        edit: function () {
            var editAccount = this.get('selectedEditAccount'),
                editAccountName = this.get('editAccountName'),
                editAccountKey = this.get('editAccountKey');

            this.store.find('account', editAccount).then(result => {
                if (result) {
                    result.set('name', editAccountName);
                    result.set('key', editAccountKey);
                    result.save();
                }

                this.send('toggleEdit');
            });
        },

        delete: function () {

        },

        addNew: function () {
            var name = this.get('account_name'),
                key = this.get('account_key'),
                newAccount = this.store.createRecord('account', {
                    name: name,
                    key: key
                });
            newAccount.save();
            this.send('connect', newAccount.get('id'));
        },

        connect: function (activeAccountId) {
            var self = this;

            this.set('loading', true);

            if (!activeAccountId) {
                activeAccountId = this.get('selectedAccount');
            }

            this.store.find('account').then(function (accounts) {
                var i, account;
                if (accounts && accounts.content && accounts.content.length > 0) {
                    for (i = 0; i < accounts.content.length; i = i + 1) {
                        account = accounts.content[i];
                        if (account.get('id') === activeAccountId) {
                            self.set('activeConnection', account.get('name'));
                            account.set('active', true);
                        } else {
                            account.set('active', false);
                        }
                    }
                }
                self.transitionToRoute('explorer');
            });
        },

        selectAndConnect: function () {
            // TODO - Move these tests to a sane place to test
            // TEST - CONTAINERS
            // this.store.find('container', { name: 'asset-02c943cc-3fce-47bc-98ac-f356f3ac414b'} )
            // .then(function(containers){
            //     containers.forEach(function(container){
            //         console.log(container.get('lastModified'));
            //         assert(container.get('lastModified') !== undefined && container.get('lastModified') !== null );
            //     });
            // });
            // var container = this.store.createRecord('container', {name: 'asset-02c943cc-3fce-47bc-98ac-f356f3ac414b'});
            // var assert = window.requireNode('assert');
            // // container.save().then(function(container){
            // //     assert(container.get('name') !== null);
            // // });

            // var once = false;
            // var assert = window.requireNode('assert');
            // this.store.find('container').then(function(containers){
            //     console.log('container listing: ');
            //     containers.forEach(function(container){
            //         assert(container !== null);
            //         console.log(container.get('name'));
            //         // console.log(container.id);
            //         // console.log(container.get('name'));
            //         // console.log(container.get('lastModified'));
            //         // console.log('got container: ' + container.get('name'));
            //         // console.dir(container);
            //         //TEST BLOBS
            //         container.get('blobs').then(function(blobs){
            //             blobs.forEach(function(blob){
            //                 console.log('got blob ' + blob.get('name'));
            //                 blob.get('link').then(function(link){
            //                     console.log('link: ' + link);
            //                 });
            //                 console.log('got blobs:');
            //                 assert(blob !== null);
            //                 console.log('BLOB:' + blob.get('container') + '/' + blob.id);
            //                 console.log('size:' + blob.get('size'));
            //                 console.log('Last Modified: ' + blob.get('lastModified'));
            //                 console.log('Type: ' + blob.get('type'));
            //             });
            //         });
            //     });
            // });
        },

        test: function () {
            var name = this.get('account_name'),
                key = this.get('account_key'),
                azureStorage = window.requireNode('azure-storage'),
                self = this,
                blobService;

            if (name && key) {
                Ember.$('#modal-testing').openModal();

                try {
                    blobService = azureStorage.createBlobService(name, key);
                    blobService.listContainersSegmented(null, function (error) {
                        if (error) {
                            self.set('result', {
                                success: false,
                                reason: error
                            });
                        }
                        self.set('result', {
                            success: true,
                            reason: null
                        });
                    });
                } catch (error) {
                    toast(error, 4000);
                }
            } else {
                return toast('Please enter name and key!');
            }
        }
    }
});
