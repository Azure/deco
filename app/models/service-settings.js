import DS from 'ember-data';
export default DS.Model.extend({

  MinuteMetrics: DS.hasOneFragment('metrics'),
  HourMetrics: DS.hasOneFragment('metrics'),
  Logging: DS.hasOneFragment('logging'),
  Cors: DS.hasOneFragment('cors')
});
