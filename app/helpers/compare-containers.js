import Ember from 'ember';

/**
 * Compares two containers
 * @param  {DS.Record} arg1 - Container object
 * @param  {string} arg2    - Name of a container
 * @return {boolean}
 */
export function compareContainers(params) {
    return (params[0].get('name') === params[1]);
}

export default Ember.Helper.helper(compareContainers);
