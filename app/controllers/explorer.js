import Ember from 'ember';

export default Ember.Controller.extend({
    needs: 'application',
    activeConnection: Ember.computed.alias('controllers.application.activeConnection'),
    azureStorage: Ember.computed.alias('nodeServices.azureStorage'),
    fileSvc: Ember.computed.alias('nodeServices.fs'),
    nodeServices: Ember.inject.service(),

    activeContainer: null,
    blobs: [],
    subDirectories: [],
    // individal directory names of current path
    pathSegments: [ { name: '/' } ],
    currentPath: function () {
        var path = '';
        var first = true;
        this.get('pathSegments').forEach(segment => {

            if (first) {
                // the first slash should be skipped
                first = false;
                return;
            }

            path += segment.name;
        });

        return path;
    }.property('pathSegments'),
    allBlobSelected: false,
    newContainerEntryDisplay: false,
    // path used for the local file path for upload
    modalFileUploadPath: '',
    // path used for the upload path to azure in the upload modal
    modalDefaultUploadPath: '',
    searchSpinnerDisplay: false,
    newContainerName: '',
    searchQuery: '',
    blobsLoading: true,
    selectedBlob: null,

    containers: function () {
        var self = this;

        if (!this.get('searchQuery')) {
            return this.get('model');
        } else {
            this.set('searchSpinnerDisplay', true);
            var promise = this.store.find('container', {name: this.get('searchQuery')});
            promise.then(() => self.set('searchSpinnerDisplay', false));
            return promise;
        }
    }.property('searchQuery'),

    activeContainerObserver: function () {
        var activeContainer = this.get('activeContainer'),
            blobs = [],
            self = this,
            containerObject;

        if (!this.get('containers').get('firstObject')) {
            // if there are no containers bail out (in case of empty search)
            return;
        }

        this.set('blobsLoading', true);

        if (!activeContainer) {
            containerObject = self.get('containers').get('firstObject');
            if (containerObject) {
                blobs = containerObject.get('blobs');

                self.set('blobs', blobs);
                self.set('blobsLoading', false);
                Ember.run.next(() => {
                    self.set('activeContainer', containerObject.id);
                });

                containerObject.listDirectoriesWithPrefix(this.get('currentPath'))
                .then(result => {

                    var subDirs = [];
                    result.forEach(dir => {
                        subDirs.push({
                            name: dir.name
                        });
                    });
                    self.set('subDirectories', subDirs);
                });

            }

        } else {
            return this.store.find('container', activeContainer).then(function (result) {
                if (result) {
                    blobs = result.get('blobs');
                } else {
                    blobs = [];
                }

                result.listDirectoriesWithPrefix(self.get('currentPath'))
                .then(result => {
                    var subDirs = [];
                    result.forEach(dir => {
                        subDirs.push({
                            name: dir.name
                        });
                    });
                    self.set('subDirectories', subDirs);
                });

                self.set('blobs', blobs);
                self.set('blobsLoading', false);

            });
        }
    }.observes('containers', 'activeContainer', 'pathSegments'),

    actions: {
        switchActiveContainer: function (selectedContainer) {
            // reset all blobs selected flag
            this.set('allBlobSelected', false);
            this.set('activeContainer', selectedContainer);
        },

        uploadBlobData: function (filePath, azurePath) {
            var self = this;
            var activeContainer = this.get('activeContainer');
            var blobName = azurePath.replace(/.*\:\//, '');
            self.store.find('container', activeContainer).then(foundContainer => {
                foundContainer.uploadBlob(filePath, blobName).then(() => {
                    self.send('refreshBlobs');
                }, error => {
                    toast(error, 4000);
                });
            });
        },

        changeDirectory: function (directory) {
            // we have recieved a path segment object, ie: the user clicked a path button
            var pathSegs = [ ];
            this.get('pathSegments').every(segment => {
                pathSegs.push(segment);

                if (segment === directory) {
                    return false;
                }

                return true;
            });

            this.set('pathSegments', pathSegs);
            this.send('refreshBlobs');
        },

        changeSubDirectory: function (directory) {

            var pathSegs = [ { name: '/' } ];

            // we have recieved a literal path
            directory.name.split('/').forEach(segment => {

                if (segment === '') {
                    return;
                }

                pathSegs.push({ name: segment + '/' });
            });

            this.set('pathSegments', pathSegs);
            this.send('refreshBlobs');
        },

        uploadBlob: function () {
            var nwInput = Ember.$('#nwUploadFile'),
                activeContainer = this.get('activeContainer'),
                self = this;

            nwInput.change(function () {
                nwInput.off('change');
                Ember.$('#modal-upload').openModal();

                // https://github.com/Dogfalo/materialize/issues/1532
                // ugh!
                var overlay = Ember.$('#lean-overlay');
                overlay.detach();
                Ember.$('.explorer-container').after(overlay);

                self.set('modalFileUploadPath', this.value);
                var fileName = this.value.replace(/^.*[\\\/]/, '');

                self.store.find('container', activeContainer).then(result => {
                    self.set('modalDefaultUploadPath', result.get('name') + ':/' + fileName);
                });

            });

            nwInput.click();
        },

        selectAllBlobs: function () {
            var self = this;
            this.get('blobs').forEach(blob => {
                if (!self.get('allBlobSelected')) {
                    blob.set('selected', true);
                } else {
                    blob.set('selected', false);
                }
            });

            this.toggleProperty('allBlobSelected');
        },

        // directory parameter is a test hook for automation
        downloadBlobs: function (directory) {
            var nwInput = Ember.$('#nwSaveInput');
            var blobs = this.get('blobs');
            nwInput.attr('nwsaveas', 'directory');

            var handleInputDirectory = function (dir) {

                blobs.forEach(function (blob) {
                    // check if this one is marked for download
                    if (blob.get('selected')){
                        var fileName = blob.get('name').replace(/^.*[\\\/]/, '');
                        var targetPath = dir + '/' + fileName;
                        blob.toFile(targetPath);
                    }
                });
            };

            // check that at least one blob is selected
            var atLeastOne = false;

            blobs.every(function (blob) {
                if (blob.get('selected')){
                    atLeastOne = true;
                    // break iteration
                    return false;
                }

                return true;
            });

            // if no blobs are selected we don't need to show the native dialog
            if (atLeastOne) {
                // native dialog won't work in automation so skip in automation
                if (!directory) {
                    nwInput.change(function () {

                        handleInputDirectory(this.value);
                        // reset value to ensure change event always fires
                        this.value = '';
                        nwInput.off('change');
                    });

                    nwInput.click();
                } else {
                    handleInputDirectory(directory);
                }
            }
        },

        selectBlob: function (blob) {
            this.set('selectedBlob', blob);
        },

        refreshBlobs: function () {
            var blobs = [],
                self = this;

            this.store.find('container', this.get('activeContainer'))
            .then(result => {
                if (result) {
                    result.set('blobPrefixFilter', self.get('currentPath'));
                    blobs = result.get('blobs');
                } else {
                    blobs = [];
                }

                self.set('blobs', blobs);
                self.set('blobsLoading', false);
            });
        },

        showNewContainer: function () {
            return this.set('newContainerEntryDisplay', true);
        },

        createContainer: function () {
            var newContainer = this.store.createRecord('container', { name: this.get('newContainerName'), id: this.get('newContainerName') });
            var self = this;
            return newContainer.save().then(function (){
                return self.set('newContainerEntryDisplay', false);
            });
        }
    }
});
