import DS from 'ember-data';

export default DS.ModelFragment.extend({
  // TODO: Add attributes
  AllowedHeaders: DS.hasManyFragments('stringValue'),
  AllowedMethods: DS.hasManyFragments('stringValue'),
  AllowedOrigins: DS.hasManyFragments('stringValue'),
  MaxAgeInSeconds: DS.attr('number')
});
