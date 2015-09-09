import {
  moduleForComponent,
  test
} from 'ember-qunit';

import Ember from "ember";
import combinedStart from 'azureexplorer/tests/helpers/combined-start';

var globals = {
    App: null,
    store: null
};

moduleForComponent('ax-application-settings', {
    needs: ['util:filesize', 'model:serviceSettings', 'model:stringValue',
    'service:nodeServices', 'service:application', 'service:notifications',
    'model:corsRule'],
    teardown: function () {
        Ember.run(globals.App, globals.App.destroy);
        window.localStorage.clear();
        globals.store = null;
    },
    unit: true
});

function testMetrics(type, assert) {
  combinedStart(assert, globals);
  assert.expect(9);
  Ember.run(() => {
      let cmpt = this.subject();

      globals.store.find('serviceSettings', 'settings')
      .then(settings => {
          cmpt.set('application.serviceSettings', settings);
          cmpt.set('application.serviceSettings.' + type + '.Enabled', true);
          cmpt.set('application.serviceSettings.' + type + '.IncludeAPIs', true);
          cmpt.set('application.serviceSettings.' + type + '.RetentionPolicy.Days', 14);
          cmpt.set('application.serviceSettings.' + type + '.RetentionPolicy.Enabled', true);
          assert.equal(cmpt.get('settings.hasDirtyAttributes'), true);
          cmpt.set('notifications.addPromiseNotification', function (promise) {
            promise.then(() => {
              assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
              assert.equal(cmpt.get('settings.' + type + '.Enabled'), true);
              assert.equal(cmpt.get('application.serviceSettings.' + type + '.RetentionPolicy.Days'), 14);
              assert.equal(cmpt.get('application.serviceSettings.' + type + '.RetentionPolicy.Enabled'), true);
              assert.equal(cmpt.get('application.serviceSettings.' + type + '.IncludeAPIs'), true);
            });
          });
          cmpt.send('updateServiceSettings');
      });

  });
}

test('it updates hour metrics w/ notificaiton', function (assert) {
  testMetrics.call(this, 'HourMetrics', assert);
});

test('it updates minute metrics w/ notification', function (assert) {
  testMetrics.call(this, 'MinuteMetrics', assert);
});

test('it updates logging metrics w/ notification', function (assert) {
    combinedStart(assert, globals);
    assert.expect(11);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);
            cmpt.set('application.serviceSettings.Logging.Enabled', true);
            cmpt.set('application.serviceSettings.Logging.RetentionPolicy.Days', 14);
            cmpt.set('application.serviceSettings.Logging.RetentionPolicy.Enabled', true);
            cmpt.set('application.serviceSettings.Logging.Delete', true);
            cmpt.set('application.serviceSettings.Logging.Read', true);
            cmpt.set('application.serviceSettings.Logging.Write', true);
            assert.equal(cmpt.get('settings.hasDirtyAttributes'), true);
            // Here we override the notification controllers function
            // in order to tell if this component is sucessfully notifying the UI
            cmpt.set('notifications.addPromiseNotification', function (promise) {
              promise.then(() => {
                assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
                assert.equal(cmpt.get('application.serviceSettings.Logging.Enabled'), true);
                assert.equal(cmpt.get('application.serviceSettings.Logging.RetentionPolicy.Days'), 14);
                assert.equal(cmpt.get('application.serviceSettings.Logging.RetentionPolicy.Enabled'), true);
                assert.equal(cmpt.get('application.serviceSettings.Logging.Delete'), true);
                assert.equal(cmpt.get('application.serviceSettings.Logging.Read'), true);
                assert.equal(cmpt.get('application.serviceSettings.Logging.Write'), true);
              });
            });
            cmpt.send('updateServiceSettings');
        });

    });
});

test('it correctly surfaces selected Cors rule info for rendering', function (assert) {
    combinedStart(assert, globals);
    assert.expect(6);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);
            cmpt.set('currentRule', settings.get('Cors.CorsRule.firstObject'));
            cmpt.send('selectRule');
            assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain.com;http://testdomain2.com;');
            assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-header1;x-ms-fake-header2;');
            assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');

            cmpt.set('currentRule', settings.get('Cors.CorsRule.lastObject'));
            cmpt.send('selectRule');
            assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain3.com;http://testdomain4.com;');
            assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-header;');
            assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');
        });

    });
});

test('it clears rule data when sent newCorsRule', function (assert) {
    combinedStart(assert, globals);
    assert.expect(6);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);
            cmpt.set('currentRule', settings.get('Cors.CorsRule.firstObject'));
            cmpt.send('selectRule');
            assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain.com;http://testdomain2.com;');
            assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-header1;x-ms-fake-header2;');
            assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');
            cmpt.send('newCorsRule');
            assert.equal(cmpt.get('selectedCorsOriginString'), '');
            assert.equal(cmpt.get('selectedCorsHeaderString'), '');
            assert.equal(cmpt.get('selectedCorsMethodString'), '');
        });

    });
});

test('it correctly deletes a rule', function (assert) {
    combinedStart(assert, globals);
    assert.expect(10);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);

            // confirm we have 2 rules provided by mock api
            assert.equal(settings.get('Cors.CorsRule.length'), 2);

            // sim 'click' on a rule
            cmpt.send('selectRule', settings.get('Cors.CorsRule.lastObject'));

            // sim 'click' on delete rule button
            cmpt.send('deleteCorsRule');
            // confirm model has unsaved changes
            assert.equal(cmpt.get('settings.hasDirtyAttributes'), true);

            // confirm notification, and check component state after resolution
            cmpt.set('notifications.addPromiseNotification', function (promise) {
              promise.then(() => {
                assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
                assert.equal(settings.get('Cors.CorsRule.length'), 1);
                cmpt.send('selectRule', settings.get('Cors.CorsRule.firstObject'));
                // confirm we deleted the second, and not the first rule
                assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain.com;http://testdomain2.com;');
                assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-header1;x-ms-fake-header2;');
                assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');

              });
            });

            cmpt.send('updateServiceSettings');
        });

    });
});

test('it correctly deletes all rules', function (assert) {
    combinedStart(assert, globals);
    assert.expect(7);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);

            // confirm we have 2 rules provided by mock api
            assert.equal(settings.get('Cors.CorsRule.length'), 2);

            // sim 'click' on a rule
            cmpt.send('selectRule', settings.get('Cors.CorsRule.lastObject'));
            cmpt.send('deleteCorsRule');
            // confirm model has unsaved changes
            assert.equal(cmpt.get('settings.hasDirtyAttributes'), true);

            // confirm notification, and check component state after resolution
            cmpt.set('notifications.addPromiseNotification', function (promise) {
              promise.then(() => {
                assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
                assert.equal(settings.get('Cors.CorsRule.length'), 0);
              });
            });

            // delete all rules
            settings.get('Cors.CorsRule').forEach( rule => {
              cmpt.set('currentRule', rule);
              cmpt.send('selectRule');
              cmpt.send('deleteCorsRule');
            });

            cmpt.send('updateServiceSettings');
        });

    });
});

test('it adds a new rule', function (assert) {
    combinedStart(assert, globals);
    assert.expect(12);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);

            // confirm we have 2 rules provided by mock api
            assert.equal(settings.get('Cors.CorsRule.length'), 2);

            cmpt.send('newCorsRule');

            // sim input by user
            cmpt.set('selectedCorsOriginString', 'http://testdomain5.com;http://testdomain6.com');
            cmpt.set('selectedCorsHeaderString', 'x-ms-fake-header5');
            cmpt.set('selectedCorsMethodString', 'PUT;POST');

            // confirm notification, and check component state after resolution
            cmpt.set('notifications.addPromiseNotification', function (promise) {
              promise.then(() => {
                assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
                assert.equal(cmpt.get('settings.Cors.CorsRule.length'), 3);

                // confirm the last rule is the one we added
                cmpt.set('currentRule', cmpt.get('settings.Cors.CorsRule.lastObject'));
                cmpt.send('selectRule');
                assert.equal('http://testdomain5.com;http://testdomain6.com;', cmpt.get('selectedCorsOriginString'));
                assert.equal('x-ms-fake-header5;', cmpt.get('selectedCorsHeaderString'));
                assert.equal('PUT;POST;', cmpt.get('selectedCorsMethodString'));

                // inspect model
                assert.equal(cmpt.get('settings.Cors.CorsRule.lastObject.AllowedOrigins.length'), 2);
                assert.equal(cmpt.get('settings.Cors.CorsRule.lastObject.AllowedMethods.length'), 2);
                assert.equal(cmpt.get('settings.Cors.CorsRule.lastObject.AllowedHeaders.length'), 1);
              });
            });

            cmpt.send('updateServiceSettings');


        });

    });
});

test('it modifies an existing rule', function (assert) {
    combinedStart(assert, globals);
    assert.expect(12);
    Ember.run(() => {
        let cmpt = this.subject();

        globals.store.find('serviceSettings', 'settings')
        .then(settings => {
            cmpt.set('application.serviceSettings', settings);
            cmpt.set('currentRule', settings.get('Cors.CorsRule.firstObject'));
            cmpt.send('selectRule');
            assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain.com;http://testdomain2.com;');
            assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-header1;x-ms-fake-header2;');
            assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');

            cmpt.set('selectedCorsOriginString', 'http://testdomain.com;http://addeddomain.com;http://testdomain2.com;');
            cmpt.set('selectedCorsHeaderString', 'x-ms-fake-replaced;x-ms-fake-header2;');

            cmpt.set('notifications.addPromiseNotification', function (promise) {
              promise.then(() => {
                assert.equal(cmpt.get('settings.hasDirtyAttributes'), false);
                assert.equal(cmpt.get('settings.Cors.CorsRule.length'), 2);
                assert.equal(cmpt.get('settings.Cors.CorsRule.firstObject.AllowedOrigins.length'), 3);
                assert.equal(cmpt.get('selectedCorsOriginString'), 'http://testdomain.com;http://addeddomain.com;http://testdomain2.com;');
                assert.equal(cmpt.get('selectedCorsHeaderString'), 'x-ms-fake-replaced;x-ms-fake-header2;');
                assert.equal(cmpt.get('selectedCorsMethodString'), 'GET;PUT;');
              });
            });

            cmpt.set('currentRule', settings.get('Cors.CorsRule.lastObject'));
            cmpt.send('updateServiceSettings');

        });

    });
});

test('it shows app version', function (assert) {
    combinedStart(assert, globals);
    assert.expect(1);
    Ember.run(() => {
        let cmpt = this.subject();

        assert.ok(cmpt.get('application.versionNumber'));

    });
});
