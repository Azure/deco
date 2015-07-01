import App from '../app';
import DS from 'ember-data';

App.ApplicationSerializer = DS.LSSerializer.extend();

export default DS.LSAdapter.extend({
    namespace: 'azureexplorer'
});
