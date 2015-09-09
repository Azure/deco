import Ember from 'ember';
import Application from '../../app';
import config from '../../config/environment';
import containerAdapter from '../../adapters/container';

export default function startApp(attrs, assert, noNodeServices) {
    var application;
    var attributes = Ember.merge({}, config.APP);
    attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

    Ember.run(function () {
        application = Application.create(attributes);
        application.setupForTesting();
        application.injectTestHelpers();
        application.ContainerAdapter = containerAdapter;
    });

    if (noNodeServices) {
        console.log('Returning app');
        return application;
    }

    var container = application.__container__;
    var nodeServices = container.lookup('service:node-services');
    var fakeData = {
        entries: [
            {
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
        subDirectories: [
            {
                name: 'mydir1/'
            },
            {
                name: 'mydir1/mydir2'
            }
        ]
    };
    var fakeSettings = {
      HourMetrics: {
          Enabled: false,
          IncludeAPIs: false,
          Days: 0,
          RetentionPolicy: {
            Enabled: false
          }
      },
      MinuteMetrics: {
          Enabled: false,
          IncludeAPIs: false,
          Days: 0,
          RetentionPolicy: {
            Enabled: false
          }
      },
      Logging: {
          Enabled: false,
          Delete: false,
          Read: false,
          Write: false,
          RetentionPolicy: {
            Enabled: false
          }
      },
      Cors: {
        CorsRule: [
          {
            AllowedHeaders: [
              'x-ms-fake-header1',
              'x-ms-fake-header2'
            ],
            AllowedMethods: [
              'GET',
              'PUT'
            ],
            AllowedOrigins: [
              'http://testdomain.com',
              'http://testdomain2.com'
            ],
            MaxAgeInSeconds: 1000,
            ExposedHeaders: [
            ]
          },
          {
            AllowedHeaders: [
              'x-ms-fake-header'
            ],
            AllowedMethods: [
              'GET',
              'PUT'
            ],
            AllowedOrigins: [
              'http://testdomain3.com',
              'http://testdomain4.com'
            ],
            MaxAgeInSeconds: 1000,
            ExposedHeaders: [
            ]
          }
        ]
      }
    };
    nodeServices.set('azureStorage', {
        BlobService: {
            SpeedSummary: function () {
                this.getSpeed = function() { return '3MB/S'; };
                this.getCompletePercent = function() { return 100; };
            }
        },
        BlobUtilities: {
            SharedAccessPermissions: {
                READ: 'READ'
            },
            BlobContainerPublicAccessType: {
                OFF: 'off',
                BLOB: 'blob',
                CONTAINER: 'container'
            }
        },

        createBlobService: function () {
            return {

                getServiceProperties: function (callback) {
                    return callback(null, fakeSettings);
                },

                setServiceProperties: function (settings, callback) {
                    assert.ok(settings);
                    assert.ok(settings.MinuteMetrics);
                    assert.ok(settings.HourMetrics);
                    fakeSettings = settings;
                    return callback();
                },

                createBlockBlobFromLocalFile: function (containerName, blobName, path, options, callback) {
                    assert.ok(typeof containerName === 'string');
                    assert.ok(typeof blobName === 'string');
                    assert.ok(typeof path === 'string');
                    assert.ok(typeof callback === 'function');
                    assert.ok(typeof options === 'object');
                    var segments = blobName.split('/');

                    if (segments.length > 1) {
                        var segment = segments[0] + '/',
                            exists = false;
                        fakeData.subDirectories.forEach(subDir => {
                            if (subDir.name === segment) {
                                exists = true;
                            }
                        });

                        if (!exists) {
                            fakeData.subDirectories.push({
                                name: segments[0] + '/'
                            });
                        }
                    }

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
                    assert.ok(shouldBeNull === null, 'expected arg shouldBeNull to be null');
                    assert.ok(callback !== null, 'expected arg callback to be non-null');
                    return callback(null, {
                        entries: [{
                            name: 'testcontainer',
                            properties: {
                                'last-modified': new Date(Date.now()),
                                leasestate: 'available',
                                leasestatus: 'unlocked',
                                etag: '==12=///'
                            }
                        }, {
                            name: 'testcontainer2',
                            properties: {
                                'last-modified': new Date(Date.now()),
                                leasestate: 'available',
                                leasestatus: 'unlocked',
                                etag: '==12=///'
                            }
                        }]
                    });
                },

                deleteContainer: function (containerName, callback) {
                    console.log(containerName, callback);
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(callback !== null, 'expected arg callback to be non-null');
                    return callback(null);
                },

                deleteBlob: function(containerName, blobName, callback) {
                    assert.ok(typeof containerName === 'string', 'expected arg containerName to be string');
                    assert.ok(typeof containerName === 'string', 'expected arg blobName to be string');
                    assert.ok(typeof callback === 'function', 'expected arg callback to be function');
                    var keepIndicies = [];

                    fakeData.entries.forEach( function(entry, index) {
                        if (entry.name !== blobName) {
                            keepIndicies.push(entry);
                        }
                    });
                    fakeData.entries = keepIndicies;
                    return callback(null);
                },

                startCopyBlob: function(sourceUri, targetContainer, targetBlob, options, callback) {
                    assert.ok(typeof sourceUri === 'string', 'expected sourceUri to be string');
                    assert.ok(typeof targetContainer === 'string', 'expected arg targetContainer to be string');
                    assert.ok(typeof targetBlob === 'string', 'expected arg targetBlob to be string');
                    assert.ok(typeof options === 'object', 'expected arg options to be object');
                    assert.ok(typeof callback === 'function', 'expected arg callback to be function');

                    return callback(null, null, {
                        entries: [{
                        }]
                    });
                },

                getContainerProperties: function (containerName, callback) {
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(callback !== null, 'expected arg callback to be non-null');
                    return callback(null, {
                        name: containerName,
                        lastModified: Date.now()
                    });
                },

                createContainer: function (containerName, callback) {
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(containerName !== '', 'expected arg containerName to be non-empty');
                    assert.ok(callback !== null, 'expected arg callback to be non-null');
                    return callback(null);
                },

                listBlobDirectoriesSegmentedWithPrefix: function (containerName, prefix, shouldBeNull, callback) {
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expected arg shouldBeNull to be null');
                    assert.ok(typeof callback === 'function');
                    assert.ok(typeof prefix === 'string');

                    var matches = [],
                        self = this;

                    if ( containerName === 'testcontainer2' ) {
                        return;
                    }
                    if (prefix === '') {
                        fakeData.subDirectories.forEach(entry => {
                            var segments = entry.name.split('/');

                            // remove empty strings
                            segments.forEach( (seg, index) => {
                                if (seg === '') {
                                    segments.splice(index, 1);
                                }
                            });

                            if (segments.length === 1) {
                                matches.push(entry);
                            }
                        });
                    } else {
                        fakeData.subDirectories.forEach(entry => {
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
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expected arg shouldBeNull to be null');
                    assert.ok(typeof callback === 'function');
                    assert.ok(typeof prefix === 'string');
                    assert.ok(typeof options === 'object');
                    assert.ok(options.delimiter);


                    var matches = [];
                    if(prefix === '') {
                        matches.push(fakeData.entries[0]);
                        matches.push(fakeData.entries[1]);
                        matches.push(fakeData.entries[2]);
                        matches.push(fakeData.entries[3]);
                    }
                    else if(prefix === '/mydir1') {
                        matches.push(fakeData.entries[5]);
                    }
                    else if(prefix === '/mydir1/mydir2') {
                        matches.push(fakeData.entries[4]);
                    }
                    return callback(null, {
                        entries: matches
                    });
                },

                listBlobsSegmented: function (containerName, shouldBeNull, callback) {
                    assert.ok(containerName !== null, 'expected arg containerName to be non-null');
                    assert.ok(shouldBeNull === null, 'expected arg shouldBeNull to be null');
                    assert.ok(callback !== null, 'expected arg callback to be non-null');
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

                getBlobToStream: function (containerName, blobName, stream, options, callback) {
                    assert.ok(containerName);
                    assert.ok(blobName);
                    assert.ok(stream);
                    assert.ok(callback);
                    assert.ok(typeof options === 'object');
                    return callback(null);
                },

                setBlobProperties: function (containerName, blobName, properties, callback) {
                    return callback(null, {
                      container: containerName,
                      blob: blobName
                    });
                },

                getContainerAcl: function(containerName, callback) {
                    assert.equal(typeof containerName, 'string', 'expected containerName to be a string');
                    return callback(null, {
                        name: 'testcontainer',
                        properties: {
                            'last-modified': new Date(Date.now()),
                            leasestate: 'available',
                            leasestatus: 'unlocked',
                            etag: '==12=///'
                        },
                        publicAccessLevel: 'BLOB'
                    });
                },

                setContainerAcl: function(containerName, shouldBeNull, publicAccessLevel, callback) {
                    Ember.Logger.debug(publicAccessLevel);
                    assert.equal(typeof containerName, 'string', 'expected containerName to be a string');
                    assert.equal(shouldBeNull, null);
                    assert.ok(publicAccessLevel === 'blob' || publicAccessLevel === 'container' || publicAccessLevel === 'off' ? true : false,
                            'expected publicAccessLevel to be a valid BlobContainerPublicAccessType');
                    return callback(null);
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
