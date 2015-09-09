import Ember from 'ember';
import DS from 'ember-data';
import serializer from '../serializers/azure-storage';
import accountUtils from '../utils/account';

export default DS.Adapter.extend({
    serializer: serializer.create(),
    nodeServices: Ember.inject.service(),

    /**
     * Parses out azure-storage-node sdk's container result into a Container Model
     * @param  {ContainerResult} entry   - The ContainerResult object from the azure storage client
     * @return {Container}
     */
    _entryToContainer: function (entry) {
        return {
            id: entry.name,
            name: entry.name,
            lastModified: new Date(Date.parse(entry.properties['last-modified'])),
            etag: entry.properties.etag,
            leaseState: entry.properties.leasestate,
            leaseStatus: entry.properties.leasestatus
        };
    },

    /**
     * Implementation of Ember Data's find method, returning a containers's meta data.
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @param  {DS.Model} type              - The DS.Model class of the record
     * @param  {DS.Snapshot} snapshot       - The DS.Snapshot (private) of the record
     * @return {Promise}
     */
    find: function (store, type, id, snapshot) {
        var self = this;

        if (!snapshot || !snapshot.attr('name')) {
            return;
        }

        return accountUtils.getBlobService(self.store, self.get('azureStorage'))
        .then(blobService => {
            var getContainerProperties = Ember.RSVP.denodeify(blobService.getContainerProperties);
            return getContainerProperties.call(blobService, snapshot.attr('name'));
        })
        .then(data => {
            return [{
                name: data.name,
                id: data.name,
                lastModified: new Date(Date.parse(data.lastModified))
            }];
        })
        .catch (error => {
           Ember.Logger.error(error);
           appInsights.trackException(error);
           throw error;
        });
    },

    /**
     * Implementation of Ember Data's createRecord method, creating a container if one doesn't exist.
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @param  {DS.Model} type              - The DS.Model class of the record
     * @param  {DS.Snapshot} snapshot       - The DS.Snapshot (private) of the record
     * @return {Promise}
     */
    createRecord: function (store, type, snapshot) {
        var self = this;

        return accountUtils.getBlobService(self.store, self.get('azureStorage'))
        .then(blobService => {
            var createContainer = Ember.RSVP.denodeify(blobService.createContainer);
            return createContainer.call(blobService, snapshot.get('name'));
        })
        .then(() => {
            return snapshot;
        })
        .catch (error => {
            Ember.Logger.error(error);
            appInsights.trackException(error);
            throw error;
        });
    },

    /**
     * Ember Data's updateRecord method. Not implemented.
     */
    updateRecord: function () {
        throw 'not implemented';
    },

    /**
     * Implementation of Ember Data's deleteRecord method, deleting a container.
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @param  {DS.Model} type              - The DS.Model class of the record
     * @param  {DS.Snapshot} snapshot       - The DS.Snapshot (private) of the record
     * @return {Promise}
     */
    deleteRecord: function (store, type, snapshot) {
        var self = this;

        return accountUtils.getBlobService(self.store, self.get('azureStorage'))
        .then(blobService => {
            var deleteContainer = Ember.RSVP.denodeify(blobService.deleteContainer);
            return deleteContainer.call(blobService, snapshot.get('name'));
        })
        .catch (error => {
            Ember.Logger.error(error);
            appInsights.trackException(error);
            throw error;
        });
    },

    /**
     * Implementation of Ember Data's findAll method, returning all containers for the current account.
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @return {Promise}
     */
    findAll: function () {
        var self = this;
        return accountUtils.getBlobService(self.store, self.get('azureStorage'))
        .then(blobService => {
            var listContainersSegmented = Ember.RSVP.denodeify(blobService.listContainersSegmented);
            return listContainersSegmented.call(blobService, null);
        })
        .then(data => {
            var containerModels = [];
            for (var i in data.entries) {
                if (i % 1 === 0) {
                    containerModels.push(this._entryToContainer(data.entries[i]));
                }
            }

            return containerModels;
        })
        .catch (error => {
            Ember.Logger.error(error);
            appInsights.trackException(error);
            // catch the error when the url does not resolve -- more likely to happen when we allow user to specify dns suffix
            throw (error);
        });
    },

    /**
     * Ember Data's findQuery method, getting all containers for the current view from the Azure Storage Node Module
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @param  {DS.Model} type              - The DS.Model class of the record
     * @param  {DS.Snapshot} snapshot       - The DS.Snapshot (private) of the record
     * @return {Promise}
     */
    findQuery: function (store, type, snapshot) {
        var self = this;
        return accountUtils.getBlobService(self.store, self.get('azureStorage'))
            .then(blobService => {
                var listContainersSegmented = Ember.RSVP.denodeify(blobService.listContainersSegmented);
                return listContainersSegmented.call(blobService, null);
            })
            .then(data => {
                var results = [];
                for (var i in data.entries) {
                    if (i % 1 === 0 &&
                        data.entries[i].name.indexOf(snapshot.name) > -1) {

                        results.push(this._entryToContainer(data.entries[i]));
                    }
                }

                return results;
            })
            .catch (error => {
                Ember.Logger.error(error);
                appInsights.trackException(error);
                throw error;
            });
    },

    /**
     * An alias for the Azure Storage Node Module.
     */
    azureStorage: Ember.computed.alias('nodeServices.azureStorage')
});
