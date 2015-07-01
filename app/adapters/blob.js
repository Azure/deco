import DS from 'ember-data';
import serializer from '../serializers/azure-storage';
import accountUtils from '../utils/account';

export default DS.Adapter.extend({
    serializer: serializer.create(),
    nodeServices: Ember.inject.service(),
    find: function (store, type, snapshot) {
        var blobService = this.get('azureStorage').createBlobService(store.account_name, store.account_key);
        return new Ember.RSVP.Promise((resolve, reject) => {
            blobService.getBlobProperties(snapshot.get('container').name, snapshot.get('name'), (error, result) => {
                if (error) {
                    return Ember.run(null, reject, error);
                }
                return Ember.run(null, resolve, result);
            });
        });
    },
    createRecord: function () {
        throw 'not implemented ';
    },
    updateRecord: function () {
        throw 'not implemented';
    },
    deleteRecord: function (store, type, snapshot) {
        var self = this;
        return new Ember.RSVP.Promise((resolve, reject) => {
            accountUtils.getActiveAccount(store).then(account => {
                var blobService = self.get('azureStorage').createBlobService(account.get('name'), account.get('key'));

                store.find('container', snapshot.attr('container_id'))
                .then(container => {
                    blobService.deleteBlob(container.get('name'), snapshot.attr('name'), (error) => {

                    if (error) {
                        return Ember.run(null, reject, error);
                    }

                        return Ember.run(null, resolve);
                    });
                });
            });
        });
    },
    findAll: function () {
        throw 'not implemented';
    },
    findQuery: function (store, type, snapshot) {
        var self = this;
        return new Ember.RSVP.Promise((resolve, reject) => {
            accountUtils.getActiveAccount(store).then(account => {
                var blobService = self.get('azureStorage').createBlobService(account.get('name'), account.get('key')),
                    // null means root directory
                    prefix = (snapshot.prefix === '/') ? null : snapshot.prefix;

                blobService.listBlobsSegmentedWithPrefix(snapshot.container.get('name'), prefix, null, { delimiter: '/' }, (error, result) => {
                    var blobs = [];

                    if (error) {
                        return Ember.run(null, reject, error);
                    }

                    // Fill out the blob models
                    for (var i in result.entries) {
                        if (i % 1 === 0) {
                            blobs.push({
                                id: result.entries[i].name,
                                name: result.entries[i].name,
                                size: result.entries[i].properties['content-length'],
                                type: result.entries[i].properties['content-type'],
                                lastModified: result.entries[i].properties['last-modified'],
                                container: snapshot.container,
                                container_id: snapshot.container_id
                            });
                        }
                    }

                    return Ember.run(null, resolve, blobs);
                });
            });
        });
    },
    azureStorage: Ember.computed.alias('nodeServices.azureStorage')
});
