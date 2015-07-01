import Ember from 'ember';
import Application from '../../app';
import Router from '../../router';
import config from '../../config/environment';
import containerAdapter from '../../adapters/container';
export default function startApp(attrs, assert) {
    var application;
    var attributes = Ember.merge({}, config.APP);
    attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;
    Ember.run(function () {
        application = Application.create(attributes);
        application.setupForTesting();
        application.injectTestHelpers();
        application.ContainerAdapter = containerAdapter;
    });
    var container = application.__container__;
    var nodeServices = container.lookup('service:node-services');
    nodeServices.set('azureStorage', {
        
        createBlobService: function () {
            return {
                entries: [{
                    name: 'test-blob-1.mp4',
                    properties: {
                        'content-type': 'video/mpeg4',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                }, {
                    name: 'test-blob-2.png',
                    properties: {
                        'content-type': 'image/png',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                }, {
                    name: 'test-blob-3.mp4',
                    properties: {
                        'content-type': 'video/mpeg4',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                },
                {
                    name: 'test-blob-4.mp4',
                    properties: {
                        'content-type': 'video/mpeg4',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                },
                {
                    name: 'mydir1/mydir2/test-blob-4.mp3',
                    properties: {
                        'content-type': 'audio/mp3',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                },
                {
                    name: 'mydir1/test-blob-5.mp3',
                    properties: {
                        'content-type': 'audio/mp3',
                        'content-length': 12313435,
                        'last-modified': new Date(Date.now())
                    }
                }],
                createBlockBlobFromLocalFile: function (containerName, blobName, path, callback) {
                    assert.ok(typeof containerName === 'string');
                    assert.ok(typeof blobName === 'string');
                    assert.ok(typeof path === 'string');
                    assert.ok(typeof callback === 'function');

                    return callback(null, null, {
                        entries: [
                            {
                                name: blobName,
                                properties: {
                                    'content-type': 'video/mpeg4',
                                    'content-length': 12313435,
                                    'last-modified': new Date(Date.now())
                                }
                            }
                        ]
                    });
                },
                listContainersSegmented: function (shouldBeNull, callback) {
                    assert.ok(shouldBeNull === null, 'expeceted arg shouldBeNull to be null');
                    assert.ok(callback !== null, 'expeceted arg callback to be non-null');
                    return callback(null, {
                        entries: [{
                            name: 'testcontainer',
                            properties: {
                                'last-modified': new Date(Date.now())
                            }
                        }, {
                            name: 'testcontainer2',
                            properties: {
                                'last-modified': new Date(Date.now())
                            }
                        }]
                    });
                },
                deleteContainer: function (containerName, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(callback !== null, 'expeceted arg callback to be non-null');
                    return callback(null);
                },
                deleteBlob: function(containerName, blobName, callback) {
                    console.log('DELETE CALLED!');
                    assert.ok(typeof containerName === 'string', 'expeceted arg containerName to be string');
                    assert.ok(typeof containerName === 'string', 'expeceted arg blobName to be string');
                    assert.ok(typeof callback === 'function', 'expeceted arg callback to be function');

                    var removeIndicies = [],
                        self = this;

                    this.entries.forEach( function(entry, index) {

                        if (entry.name === blobName) {
                            removeIndicies.push(index);
                        }
                    });

                    removeIndicies.forEach( function(index) {
                        self.entries.splice(index, 1);
                    });

                    return callback(null);
                },
                getContainerProperties: function (containerName, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(callback !== null, 'expeceted arg callback to be non-null');
                    return callback(null, {
                        name: containerName,
                        lastModified: Date.now()
                    });
                },
                createContainerIfNotExists: function (containerName, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(callback !== null, 'expeceted arg callback to be non-null');
                    return callback(null);
                },
                listBlobDirectoriesSegmentedWithPrefix: function (containerName, prefix, shouldBeNull, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expeceted arg shouldBeNull to be null');
                    assert.ok(typeof callback === 'function');
                    assert.ok(typeof prefix === 'string');
                    console.log('called with prefix: ' + prefix);
                    var entries = [
                        {
                            name: 'mydir1/'
                        },
                        {
                            name: 'mydir1/mydir2'
                        }
                    ];

                    var matches = [];

                    if (prefix === '') {
                        matches.push({
                            name: 'mydir1/'
                        });
                    } else {
                        entries.forEach(entry => {
                            if (entry.name.startsWith(prefix)) {
                                matches.push(entry);
                            }
                        });
                    }
                    
                    return callback(null, {
                        entries: matches     
                    });
                },
                listBlobsSegmentedWithPrefix: function (containerName, prefix, shouldBeNull, options, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expeceted arg shouldBeNull to be null');
                    assert.ok(typeof callback === 'function');
                    assert.ok(typeof prefix === 'string');
                    assert.ok(typeof options === 'object');
                    assert.ok(options.delimiter);
                    console.log('called with prefix: ' + prefix);
                    

                    var matches = [];

                    if(prefix === '') {
                        matches.push(this.entries[0]);
                        matches.push(this.entries[1]);
                        matches.push(this.entries[2]);
                        matches.push(this.entries[3]);
                    }
                    else if(prefix === '/mydir1') {
                        matches.push(this.entries[5]);
                    }
                    else if(prefix === '/mydir1/mydir2') {
                        matches.push(this.entries[4]);
                    }
                    return callback(null, {
                        entries: matches
                    });
                },
                listBlobsSegmented: function (containerName, shouldBeNull, callback) {
                    assert.ok(containerName !== null, 'expeceted arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expeceted arg shouldBeNull to be null');
                    assert.ok(callback !== null, 'expeceted arg callback to be non-null');
                    return callback(null, {
                        entries: [{
                            name: 'test-blob-1.mp4',
                            properties: {
                                'content-type': 'video/mpeg4',
                                'content-length': 12313435,
                                'last-modified': new Date(Date.now())
                            }
                        }, {
                            name: 'test-blob-2.png',
                            properties: {
                                'content-type': 'image/png',
                                'content-length': 12313435,
                                'last-modified': new Date(Date.now())
                            }
                        }, {
                            name: 'test-blob-3.mp4',
                            properties: {
                                'content-type': 'video/mpeg4',
                                'content-length': 12313435,
                                'last-modified': new Date(Date.now())
                            }
                        }, {
                            name: 'test-blob-4.mp3',
                            properties: {
                                'content-type': 'audio/mp3',
                                'content-length': 12313435,
                                'last-modified': new Date(Date.now())
                            }
                        }]
                    });
                },
                generateSharedAccessSignature: function () {
                    assert.ok(true);
                    // litterally just mashed my keyboard here :-)
                    return '32523fdsgjsdkh5r43r89hvsghsdhafkjwerhs';
                },
                getUrl: function () {
                    assert.ok(true);
                    return 'https://testaccount.storage.windows.net/somecontainer/test-blob?expiry=2000';
                },
                getBlobToStream: function (containerName, blobName, stream, callback) {
                    assert.ok(containerName);
                    assert.ok(blobName);
                    assert.ok(stream);
                    assert.ok(callback);
                    return callback(null);
                },
                BlobUtilities: {
                    SharedAccessPermissions: {
                        READ: 'READ'
                    }
                }
            };
        }
    });
    nodeServices.set('fs', {
        existsSync: function (path) {
            return false;
        },
        mkdirSync: function (path) {
            assert.ok(path);
            return null;
        },
        createWriteStream: function (path) {
            assert.ok(path);
            return {};
        }
    });
    return application;
}
