import Ember from 'ember';

export default Ember.Route.extend({

    model: function () {
        return this.store.find('container');
    },

    willTransition: function () {
        this.controller.notifyPropertyChange('searchQuery');
        this.controller.notifyPropertyChange('pathSegments');
    },

    resetController: function (controller, isExiting) {
        if (isExiting) {
            // Reset the whole explorer controller on exit
            controller.set('model', null);
            controller.set('blobs', []);
            controller.set('subDirectories', []);
            controller.set('pathSegments', [{name: '/'}]);
            controller.set('allBlobSelected', false);
            controller.set('newContainerEntryDisplay', false);
            controller.set('modalFileUploadPath', '');
            controller.set('modalDefaultUploadPath', '');
            controller.set('searchSpinnerDisplay', false);
            controller.set('newContainerName', '');
            controller.set('searchQuery', '');
            controller.set('blobsLoading', true);
            controller.set('selectedBlob', null);

            this.store.unloadAll('container');

            Ember.run.next(() => {
                controller.set('activeContainer', null);
            });
        }
    },

    actions: {
        refresh: function () {
            return this.refresh();
        }
    }
});
