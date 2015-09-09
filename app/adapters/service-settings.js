import Ember from 'ember';
import DS from 'ember-data';
import serializer from '../serializers/azure-storage';
import accountUtils from '../utils/account';

export default DS.Adapter.extend({
  serializer: serializer.create(),
    nodeServices: Ember.inject.service(),

    /**
     * 'Unpacks' CORS rule for compatibilty with the ember data model for cors rule entity
     * @param  {object} - The 'raw' rules object from azure API
     * @return {object} - A 'compatible' rules object for ember-data.
     */
    _unpackCorsRule: function (rule) {
      rule.AllowedOrigins.forEach((origin, index) => {
        rule.AllowedOrigins[index] = { Value: origin };
      });
      rule.AllowedMethods.forEach((method, index) => {
        rule.AllowedMethods[index] = { Value: method };
      });
      rule.AllowedHeaders.forEach((header, index) => {
        rule.AllowedHeaders[index] = { Value: header };
      });

      return rule;
    },

    _addRetentionPolicy: function (metricsObject, snapshot) {
      metricsObject.RetentionPolicy = {
          Enabled: snapshot.attr('RetentionPolicy').attr('Enabled')
      };

      if (metricsObject.RetentionPolicy.Enabled) {
        metricsObject.RetentionPolicy.Days = snapshot.attr('RetentionPolicy').attr('Days');
      }
    },

    _transfromCors: function (snapshot) {

      var cors = {
            CorsRule: []
          };

      if (snapshot.attr('Cors') && snapshot.attr('Cors').attr('CorsRule')) {
        var rules = snapshot.attr('Cors').attr('CorsRule');

        rules.forEach(rule => {
          var flattedOrigins = [],
              flattedHeaders = [],
              flattedMethods = [];

          rule.attr('AllowedOrigins').forEach(origin => {
            flattedOrigins.push(origin.attr('Value'));
          });
          rule.attr('AllowedMethods').forEach(method  => {
            flattedMethods.push(method.attr('Value'));
          });
          rule.attr('AllowedHeaders').forEach(header => {
            flattedHeaders.push(header.attr('Value'));
          });

          cors.CorsRule.push({
            AllowedHeaders: flattedHeaders,
            AllowedMethods: flattedMethods,
            AllowedOrigins: flattedOrigins,
            MaxAgeInSeconds: rule.attr('MaxAgeInSeconds'),
            ExposedHeaders: []
          });
        });
      }

      return cors;

    },

    _transfromSettings: function (snapshot) {
      var minuteMetrics = {
          Enabled: snapshot.attr('MinuteMetrics').attr('Enabled'),
          IncludeAPIs: snapshot.attr('MinuteMetrics').attr('IncludeAPIs') ? true : undefined
        },
        hourMetrics = {
          Enabled: snapshot.attr('HourMetrics').attr('Enabled'),
          IncludeAPIs: snapshot.attr('HourMetrics').attr('IncludeAPIs') ? true : undefined
        },
        logging = {
          Delete: snapshot.attr('Logging').attr('Delete'),
          Read: snapshot.attr('Logging').attr('Read'),
          Write: snapshot.attr('Logging').attr('Write')
        };

      if (snapshot.attr('MinuteMetrics').attr('RetentionPolicy')) {
        this._addRetentionPolicy(minuteMetrics, snapshot.attr('MinuteMetrics'));
      }

      if (snapshot.attr('HourMetrics').attr('RetentionPolicy')) {
        this._addRetentionPolicy(minuteMetrics, snapshot.attr('HourMetrics'));
      }

      if (snapshot.attr('Logging').attr('RetentionPolicy')) {
        this._addRetentionPolicy(logging, snapshot.attr('Logging'));
      }

      var settings = {
        MinuteMetrics: minuteMetrics,
        HourMetrics: hourMetrics,
        Logging: logging,
        Cors: this._transfromCors(snapshot)
      };

      Ember.Logger.debug('updating settings:');
      Ember.Logger.debug(settings);
      return settings;
    },
    /**
     * Implementation of Ember Data's find method, returning the settings record
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @return {Promise}
     */
    find: function (store, type, id) {
        return accountUtils.getBlobService(store, this.get('azureStorage'))
        .then(blobService => {
          var getServiceProperties = Ember.RSVP.denodeify(blobService.getServiceProperties);

          return getServiceProperties.call(blobService);

        })
        .then(settings => {
          // there will always be just one settings object
          // so give it a fixed id
          settings.id = id;
          Ember.Logger.debug('found settings:');
          Ember.Logger.debug(settings);

          if (settings.Cors.CorsRule) {
            // each value needs to be unpacked from string array
            // to be compatible for ember data.
            settings.Cors.CorsRule.forEach(rule => {
              this._unpackCorsRule(rule);
            });
          }

          return settings;
        })
        .catch (error => {
          Ember.Logger.debug(error);
          throw (error);
        });
    },

    /**
     * Ember Data's createRecord method - not implemented (because blobs are read-only)
     */
    createRecord: function () {
      Ember.Logger.debug('create record not implemented');
        throw 'not implemented ';
    },

    /**
     * Ember Data's updateRecord method - Only Updates Valid Property Fields
     * @param  {DS.Store} store             - The DS.Store, containing all data for records loaded
     * @param  {DS.Model} type              - The DS.Model class of the record
     * @param  {DS.Snapshot} snapshot       - The DS.Snapshot (private) of the record
     * @return {Promise}
     */
    updateRecord: function (store, type, snapshot) {
        var transformed;
        return accountUtils.getBlobService(this.store, this.get('azureStorage'))
        .then(blobService => {
          var setServiceProperties = Ember.RSVP.denodeify(blobService.setServiceProperties);

          // Azure SDK looks for all properties on object. Ember adds extra stuff
          // to objects so ensure a clean settings object gets to the sdk.
          transformed = this._transfromSettings(snapshot);
          Ember.Logger.debug('updating settings:');
          Ember.Logger.debug(transformed);
          return setServiceProperties.call(blobService, transformed);
        })
        .then(() => {
          transformed.id = snapshot.id;
          transformed.Cors.CorsRule.forEach(rule => {
            this._unpackCorsRule(rule);
          });
          return transformed;
        })
        .catch (error => {
          throw error;
        });
    },

    /**
     *  Service settings cannot be deleted
     */
    deleteRecord: function () {
      Ember.Logger.debug('deleteRecord not implemented');
        throw 'not implemented';
    },

    /**
     * Ember Data's findAll method, used to retrieve all records for a given type.
     * Is an alias to find since there is only 1 record.
     */
    findAll: function (store) {
      return this.find(store);
    },

    /**
     * Not implemented, since there is only one record
     */
    findQuery: function () {
      Ember.Logger.debug('findQuery not implemented');
        throw 'not implemented';
    },

    /**
     * An alias for the Azure Storage Node Module.
     */
    azureStorage: Ember.computed.alias('nodeServices.azureStorage')
});
