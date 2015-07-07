import Ember from 'ember';
import config from '../config/environment';

/**
 * The controller for the file explorer - in many ways the main controller for the application,
 * controlling container/blob selection and interaction.
 */
export default Ember.Controller.extend({
    // Services & Aliases
    // ------------------------------------------------------------------------------
    needs: ['application', 'notifications'],
    activeConnection: Ember.computed.alias('controllers.application.activeConnection'),
    notifications: Ember.computed.alias('controllers.notifications'),
    azureStorage: Ember.computed.alias('nodeServices.azureStorage'),
    fileSvc: Ember.computed.alias('nodeServices.fs'),
    nodeServices: Ember.inject.service(),

    // Properties
    // ------------------------------------------------------------------------------
    activeContainer: null,              // DS.Record of the currently selected container
    blobs: [],                          // Ember.MutableArray containing the blobs for the current container
    subDirectories: [],                 // Ember.MutableArray containing the directories for the current container
    pathSegments: [{name: '/'}],        // Individal directory names of current path
    allBlobSelected: false,             // Are all blobs selected?
    newContainerEntryDisplay: false,
    modalFileUploadPath: '',            // Path used for the local file path for upload
    modalDefaultUploadPath: '',         // Path used for the upload path to azure in the upload modal
    searchSpinnerDisplay: false,        // Should the 'searching for a container' spinner be displayed
    newContainerName: '',               // Placeholder property for the 'create a container' action
    searchQuery: '',                    // Search query for containers
    blobsLoading: true,                 // Are we loading blobs
    selectedBlob: null,                 // DS.Record of the currently selected blob

    // Init & Setup
    // ------------------------------------------------------------------------------
    init: function () {
        if (config.environment !== 'test') {
            Ember.run.scheduleOnce('afterRender', this, () => {
                var self = this;
                Ember.$('.files')[0].ondrop = e => {
                    self.send('handleFileDragDrop', e);
                };
            });
        }
    },

    // Computed Properties
    // ------------------------------------------------------------------------------
    /**
     * Either all containers in the model or, if a container search query is set,
     * all the containers matching the query.
     * @return {Promise}
     */
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

    /**
     * Composes the current "faked" path
     * @return {string}
     */
    currentPath: function () {
        var path = '';
        var first = true;
        this.get('pathSegments').forEach(segment => {
            // the first slash should be skipped
            if (first) {
                first = false;
                return;
            }

            path += segment.name;
        });

        return path;
    }.property('pathSegments'),

    // Observers
    // ------------------------------------------------------------------------------
    /**
     * Observes the currently selected container and responds to changes by
     * setting up blobs
     */
    activeContainerObserver: function () {
        var activeContainer = this.get('activeContainer'),
            blobs = [],
            self = this,
            containerObject;

        if (!this.get('containers') || !this.get('containers').get('firstObject')) {
            // if there are no containers bail out (in case of empty search)
            return;
        }

        // clear out subdirs'
        this.set('blobsLoading', true);
        this.set('subDirectories', []);

        if (!activeContainer) {
            containerObject = self.get('containers').get('firstObject');
            containerObject.set('blobPrefixFilter', self.get('currentPath'));
            if (containerObject) {
                blobs = containerObject.get('blobs');

                self.set('blobs', blobs);
                self.set('blobsLoading', false);
                appInsights.trackMetric('BlobsInContainer', blobs.length);

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
                    result.set('blobPrefixFilter', self.get('currentPath'));
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

                appInsights.trackMetric('BlobsInContainer', blobs.length);
            });
        }
    }.observes('containers', 'activeContainer', 'model'),

    pathSegmentObserver : function () {
        this.set('subDirectories', []);
    }.observes('pathSegments'),

    // Actions
    // ------------------------------------------------------------------------------
    actions: {
        /**
         * Handle a file dragged into the window (by uploading it)
         */
        handleFileDragDrop: function (e) {
            var sourcePaths = '',
                self = this,
                activeContainer = this.get('activeContainer'),
                file;

            // dataTransfer.files doesn't have forEach
            for (var i in e.dataTransfer.files) {
                if (i % 1 === 0) {
                    file = e.dataTransfer.files[i];
                    if (i < e.dataTransfer.files.length - 1) {
                        sourcePaths += file.path + ';';
                    } else {
                        sourcePaths += file.path;
                    }
                }
            }

            Ember.$('#modal-upload').openModal();

            // Ugh: https://github.com/Dogfalo/materialize/issues/1532
            var overlay = Ember.$('#lean-overlay');
            overlay.detach();
            Ember.$('.explorer-container').after(overlay);

            self.set('modalFileUploadPath', sourcePaths);

            self.store.find('container', activeContainer).then(result => {
                self.set('modalDefaultUploadPath', result.get('name') + ':/' + self.get('currentPath'));
            });

            appInsights.trackEvent('handleFileDragDrop');
        },

        /**
         * Switch the active container, plus minor housekeeping
         * @param  {DS.Record Container} selectedContainer - The container to be selected
         */
        switchActiveContainer: function (selectedContainer) {
            // reset all blobs selected flag
            if (selectedContainer === this.get('activeContainer')) {
                return;
            }
            this.set('pathSegments', [{ name: '/' }]);
            this.set('allBlobSelected', false);
            this.set('activeContainer', selectedContainer);

            appInsights.trackEvent('switchActiveContainer');
        },

        /**
         * Upload one or multiple files to blobs
         * @param  {Array} filePaths  - Local file paths of the files to upload
         * @param  {string} azurePath - Remote Azure Storage path
         */
        uploadBlobData: function (filePaths, azurePath) {
            var self = this,
                activeContainer = this.get('activeContainer'),
                containerPath = azurePath.replace(/.*\:\//, ''),
                paths = filePaths.split(';'),
                fileName;

            self.store.find('container', activeContainer).then(foundContainer => {
                var promises = [];

                paths.forEach(path => {
                    fileName = path.replace(/^.*[\\\/]/, '');
                    promises.push(foundContainer.uploadBlob(path, containerPath + fileName));
                });

                appInsights.trackEvent('uploadBlobData');
                appInsights.trackMetric('uploadBlobs', paths.length);

                return Ember.RSVP.all(promises);
            }).then(() => {
                self.send('refreshBlobs');
            }).catch (error => {
                toast(error, 4000);
            });
        },

        /**
         * Change the current "faked" directory
         * @param  {string} directory
         */
        changeDirectory: function (directory) {
            // we have recieved a path segment object, ie: the user clicked a path button
            var pathSegs = [];

            this.get('pathSegments').every(segment => {
                pathSegs.push(segment);
                return (segment !== directory);
            });
            this.set('subDirectories', []);
            this.set('pathSegments', pathSegs);
            this.send('refreshBlobs');

            appInsights.trackEvent('changeDirectory');
        },

        /**
         * Change the current "faked" sub directory
         * @param  {string} directory
         */
        changeSubDirectory: function (directory) {
            var pathSegs = [{name: '/'}];

            // we have recieved a literal path
            directory.name.split('/').forEach(segment => {
                if (segment === '') {
                    return;
                }

                pathSegs.push({name: segment + '/'});
            });

            this.set('pathSegments', pathSegs);
            this.send('refreshBlobs');
        },

        /**
         * Open the upload file modal
         */
        uploadBlob: function () {
            var nwInput = Ember.$('#nwUploadFile'),
                activeContainer = this.get('activeContainer'),
                self = this;

            nwInput.change(function () {
                nwInput.off('change');
                Ember.$('#modal-upload').openModal();

                // Ugh: https://github.com/Dogfalo/materialize/issues/1532
                var overlay = Ember.$('#lean-overlay');
                overlay.detach();
                Ember.$('.explorer-container').after(overlay);

                self.set('modalFileUploadPath', this.value);

                self.store.find('container', activeContainer).then(result => {
                    self.set('modalDefaultUploadPath', result.get('name') + ':/' + self.get('currentPath'));
                });

                // Ensure event fires
                this.value = '';
            });

            nwInput.click();

            appInsights.trackEvent('uploadBlob');
        },

        /**
         * Select all blobs in the current view
         */
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

            appInsights.trackEvent('selectAllBlobs');
        },

        /**
         * Download all the selected blobs in a directory.
         * Directory parameter is a test hook for automation.
         * @param  {string} directory
         */
        downloadBlobs: function (directory) {
            var nwInput = Ember.$('#nwSaveInput'),
                blobs = this.get('blobs'),
                handleInputDirectory;

            nwInput.attr('nwsaveas', 'directory');

            handleInputDirectory = function (dir) {
                blobs.forEach(function (blob) {
                    // Check if this one is marked for download
                    if (blob.get('selected')) {
                        var fileName = blob.get('name').replace(/^.*[\\\/]/, '');
                        var targetPath = dir + '/' + fileName;
                        blob.toFile(targetPath);
                    }
                });
            };

            // Check that at least one blob is selected
            var noBlobsSelected = blobs.every(blob => {
                return (!blob.get('selected'));
            });

            // If no blobs are selected we don't need to show the native dialog
            if (!noBlobsSelected) {
                // Native dialog won't work in automation so skip in automation
                if (!directory) {
                    nwInput.change(function () {
                        handleInputDirectory(this.value);
                        // Reset value to ensure change event always fires
                        this.value = '';
                        nwInput.off('change');
                    });

                    nwInput.click();
                } else {
                    handleInputDirectory(directory);
                }
            }

            appInsights.trackEvent('downloadBlobs');
        },

        /**
         * Mark a given blob as selected
         * @param  {DS.Record} blob
         */
        selectBlob: function (blob) {
            this.set('selectedBlob', blob);
        },

        /**
         * Open the 'delete blobs' modal.
         */
        deleteBlobs: function () {
            var blobs = this.get('blobs'),
                deleteCount = 0;

            blobs.forEach(function (blob) {
                if (blob.get('selected')) {
                    deleteCount += 1;
                }
            });

            if (deleteCount === 0) {
                return;
            }

            // Setup values expected by delete modal
            this.set('modalConfirmAction', 'deleteBlobData');
            this.set('modalDeleteCount', deleteCount);
            this.set('modalDeleteType', 'blob');

            // Open delete prompt
            Ember.$('#modal-delete').openModal();

            // Ugh: https://github.com/Dogfalo/materialize/issues/1532
            var overlay = Ember.$('#lean-overlay');
            overlay.detach();
            Ember.$('.explorer-container').after(overlay);

            appInsights.trackEvent('deleteBlobs');
        },

        /**
         * Delete all the selected blobs
         */
        deleteBlobData: function () {
            var blobs = this.get('blobs'),
                self = this;

            blobs.forEach(function (blob) {
                // check if this one is marked for deleting
                if (blob.get('selected')) {
                    blob.deleteRecord();
                    blob.save();
                    if (blob === self.get('selectedBlob')) {
                        self.set('selectBlob', null);
                    }
                }
            });

            this.set('blobs', blobs);
        },

        /**
         * Refresh the current blobs. Useful if the blobs have changed.
         */
        refreshBlobs: function () {
            var blobs = [],
                self = this;

            this.store.find('container', this.get('activeContainer')).then(result => {
                if (result) {
                    result.set('blobPrefixFilter', self.get('currentPath'));
                    blobs = result.get('blobs');
                } else {
                    blobs = [];
                }

                self.set('blobs', blobs);
                self.set('blobsLoading', false);
                return result;
            }).then(container => {
                return container.listDirectoriesWithPrefix(self.get('currentPath'));
            }).then(result => {
                var subDirs = [];
                result.forEach(dir => {
                    subDirs.push({
                        name: dir.name
                    });
                });
                self.set('subDirectories', subDirs);
            });

            appInsights.trackEvent('refreshBlobs');
        },

        /**
         * Display the new container name input field
         */
        showNewContainer: function () {
            return this.set('newContainerEntryDisplay', true);
        },

        /**
         * Create a new container
         */
        createContainer: function () {
            var newContainer = this.store.createRecord('container', {name: this.get('newContainerName'), id: this.get('newContainerName')});
            var self = this;
            return newContainer.save().then(function () {
                return self.set('newContainerEntryDisplay', false);
            });
        },

        /**
         * Go back to the welcome screen
         */
        goHome: function () {
            this.transitionToRoute('welcome');
        }
    }
});
