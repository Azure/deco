import Ember from 'ember';
import Notification from '../models/notification';
import stringResources from '../utils/string-resources';

export default Ember.Component.extend({
  application: Ember.inject.service(),
  store: Ember.inject.service(),
  notifications: Ember.inject.service('notifications'),
  onOffContent: [false, true],
  settings: Ember.computed.alias('application.serviceSettings'),
  showLogging: false,
  showMetrics: true,
  showAbout: false,
  showCORS: false,
  showNewRule: false,
  showEditRule: false,
  currentRule: Ember.computed.alias('settings.Cors.CorsRule.firstObject'),
  minuteMetricsDisabled: Ember.computed.not('settings.MinuteMetrics.Enabled'),
  hourMetricsDisabled: Ember.computed.not('settings.HourMetrics.Enabled'),

  _corsString: function (property) {

    var displayString = '';

    if (!this.get(property)) {
      return;
    }
    this.get(property).forEach(origin => {
        console.log(origin);
        displayString += origin.get('Value') + ';';
    });
    return displayString;
  },

  _assembleCorsArray: function (value) {

    var parts = value.split(';'),
        fragArray = [];

    parts.forEach(origin => {
      if (origin.length <= 0) {
        return;
      }
      fragArray.push(this.get('store').createFragment('stringValue', { Value: origin }));
    });

    return fragArray;
  },

  _updateCorsRules: function () {

    var allowedOrigins = this._assembleCorsArray(this.get('selectedCorsOriginString')),
        allowedHeaders = this._assembleCorsArray(this.get('selectedCorsHeaderString')),
        allowedMethods = this._assembleCorsArray(this.get('selectedCorsMethodString'));

    if (!this.get('settings.Cors.CorsRule')) {
      this.set('settings.Cors.CorsRule', []);
    }

    if (this.get('selectedCorsOriginString.length') > 0 ||
      this.get('selectedCorsHeaderString.length') > 0 ||
      this.get('selectedCorsMethodString.length') > 0) {

      if (this.get('showNewRule')) {
        var fragment = this.get('store').createFragment('corsRule', {
          AllowedOrigins: allowedOrigins,
          AllowedHeaders: allowedHeaders,
          AllowedMethods: allowedMethods,
          MaxAgeInSeconds: parseInt(this.get('selectedMaxAgeSeconds'))
        });

        this.get('settings.Cors.CorsRule').addFragment(fragment);
      } else if (this.get('showEditRule') && this.get('currentRule')) {
        this.set('currentRule.AllowedOrigins', allowedOrigins);
        this.set('currentRule.AllowedMethods', allowedMethods);
        this.set('currentRule.AllowedHeaders', allowedHeaders);
        this.set('currentRule.MaxAgeInSeconds', parseInt(this.get('selectedMaxAgeSeconds')));
      }
    }
  },

  selectedCorsOriginString: '',

  selectedCorsHeaderString: '',

  selectedCorsMethodString: '',

  selectedMaxAgeSeconds: '500',

  hourMetricsRetentionDisabled: function () {
    return !this.get('settings.HourMetrics.RetentionPolicy.Enabled') || !this.get('settings.HourMetrics.Enabled');
  }.property('settings.HourMetrics.RetentionPolicy.Enabled', 'settings.HourMetrics.Enabled'),

  minuteMetricsRetentionDisabled: function () {
    return !this.get('settings.MinuteMetrics.RetentionPolicy.Enabled') || !this.get('settings.MinuteMetrics.Enabled');
  }.property('settings.MinuteMetrics.RetentionPolicy.Enabled', 'settings.MinuteMetrics.Enabled'),

  loggingRetentionDisabled: Ember.computed.not('settings.Logging.RetentionPolicy.Enabled'),

  showUpdateButton: function () {
    return this.get('application.serviceSettings.hasDirtyAttributes') &&
      (!this.get('showAbout')) || (this.get('selectedCorsOriginString').length > 0 ||
      this.get('selectedCorsHeaderString').length > 0 ||
      this.get('selectedCorsMethodString').length > 0 ||
      this.get('selectedMaxAgeSeconds').length > 0);
  }.property('application.serviceSettings.hasDirtyAttributes', 'showAbout', 'selectedCorsOriginString',
    'selectedCorsHeaderString', 'selectedCorsMethodString', 'selectedMaxAgeSeconds'),

  init: function () {
    this._renderSelect();
    return this._super();
  },

  _renderSelect: function () {
    // required to materialize css select
    Ember.run.scheduleOnce('afterRender', this, () => {
            Ember.$('select').material_select();
        });
  },

  _enableTab: function (tabFlagName) {
    this.set('showLogging', false);
    this.set('showTelemetry', false);
    this.set('showMetrics', false);
    this.set('showAbout', false);
    this.set('showCORS', false);

    this.set(tabFlagName, true);
    this._renderSelect();
  },

  actions: {

    deleteCorsRule: function () {
      this.get('settings.Cors.CorsRule').removeFragment(this.get('currentRule'));
    },

    newCorsRule: function () {
      this.set('showNewRule', true);
      this.set('showEditRule', false);
      this.set('selectedCorsOriginString', '');
      this.set('selectedCorsHeaderString', '');
      this.set('selectedCorsMethodString', '');
      this.set('selectedMaxAgeSeconds', '');
    },

    selectRule: function () {
      this.set('selectedCorsOriginString', this._corsString('currentRule.AllowedOrigins'));
      this.set('selectedCorsHeaderString', this._corsString('currentRule.AllowedHeaders'));
      this.set('selectedCorsMethodString', this._corsString('currentRule.AllowedMethods'));
      this.set('selectedMaxAgeSeconds', this.get('currentRule.MaxAgeInSeconds'));
      this.set('showEditRule', true);
      this.set('showNewRule', false);
    },

    actionMetrics: function () {
      this._enableTab('showMetrics');
    },

    actionLogging: function () {
      this._enableTab('showLogging');
    },

    actionCORS: function () {
      this._enableTab('showCORS');
    },

    actionAbout: function () {
      this.set('showUpdateButton', false);
      this._enableTab('showAbout');
    },

    actionUsageTelemetry: function () {
      this._enableTab('showTelemetry');
    },

    handleUpdate: function () {
      this.send('updateServiceSettings');
    },

    updateServiceSettings: function () {
      var notifications = this.get('notifications');

      if (!this.get('settings.MinuteMetrics.Enabled')) {
        this.set('settings.MinuteMetrics.IncludeAPIs', null);
        this.set('settings.MinuteMetrics.RetentionPolicy', null);
      }

      if (!this.get('settings.HourMetrics.Enabled')) {
        this.set('settings.HourMetrics.IncludeAPIs', null);
        this.set('settings.HourMetrics.RetentionPolicy', null);
      }

      if (!this.get('settings.Logging.RetentionPolicy')) {
        this.set('settings.Logging.RetentionPolicy', null);
      }

      this._updateCorsRules();
      notifications.addPromiseNotification(this.get('application.serviceSettings').save(),
        Notification.create({
          type: 'UpdateServiceSettings',
          text: stringResources.updateServiceSettings()
        })
      );
    },

    discardUnsavedChanges: function () {
      this.get('application.serviceSettings').rollbackAttributes();
      this._enableTab('showMetrics');
    }
  }
});
