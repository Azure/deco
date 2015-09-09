export default {
    /**
     * Attach the menu as Electron's window menu
     * @param {boolean} handlers - Are tools available?
     */
    setup: function (handlers) {
        handlers = handlers || false;

        var remote = requireNode('remote'),
            Menu = remote.require('menu'),
            toolsEnabled = (handlers);

        let template = [{
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        }, {
            label: 'Tools',
            submenu: [{
                label: 'Upload Blobs',
                enabled: toolsEnabled,
                click: handlers.uploadBlob
            },
            {
                label: 'Download Blobs',
                enabled: toolsEnabled,
                click: handlers.downloadBlobs
            },
            {
                label: 'Delete Selected Blobs',
                enabled: toolsEnabled,
                click: handlers.deleteBlobs
            },
            {
                label: 'Copy Selected Blobs',
                enabled: toolsEnabled,
                click: handlers.copyBlobs
            },
            {
                label: 'Refresh Blobs',
                enabled: toolsEnabled,
                click: handlers.refreshBlobs
            },
            {
                label: 'Create Container',
                enabled: toolsEnabled,
                click: handlers.addContainer
            },
            {
                label: 'Delete Current Container',
                enabled: toolsEnabled,
                click: handlers.removeContainer
            },
            {
                label: 'Switch Account',
                enabled: toolsEnabled,
                click: handlers.switchAccount
            }]
        }, {
            label: 'View',
            submenu: [{
                label: 'Reload Storage Explorer',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.reload();
                    }
                }
            }, {
                label: 'Toggle Full Screen',
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'Ctrl+Command+F';
                    } else {
                        return 'F11';
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            }, {
                label: 'Toggle Developer Tools',
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'Alt+Command+I';
                    } else {
                        return 'Ctrl+Shift+I';
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                }
            }]
        }, {
            label: 'Window',
            role: 'window',
            submenu: [{
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            }]
        }, {
            label: 'Help',
            role: 'help',
            submenu: [{
                label: 'Learn More',
                click: function () {
                    requireNode('shell').openExternal('http://storageexplorer.com');
                }
            }, {
                label: 'Azure Storage Documentation',
                click: function () {
                    requireNode('shell').openExternal('http://azure.microsoft.com/en-us/documentation/services/storage/');
                }
            }, {
                label: 'Azure Documentation',
                click: function () {
                    requireNode('shell').openExternal('http://azure.microsoft.com/en-us/documentation/');
                }
            }, {
                label: 'Report Bugs and Issues',
                click: function () {
                    requireNode('shell').openExternal('https://github.com/azure-storage/xplat/issues/');
                }
            }]
        }];

        if (process.platform === 'darwin') {
            template.unshift({
                label: 'Azure Storage Explorer',
                submenu: [{
                    label: 'About Azure Storage Explorer',
                    role: 'about'
                }, {
                    type: 'separator'
                }, {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                }, {
                    type: 'separator'
                }, {
                    label: 'Hide ' + name,
                    accelerator: 'Command+H',
                    role: 'hide'
                }, {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    role: 'hideothers:'
                }, {
                    label: 'Show All',
                    role: 'unhide:'
                }, {
                    type: 'separator'
                }, {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function () {
                        let app = requireNode('remote').require('app');
                        app.quit();
                    }
                }]
            });
            // Window menu.
            template[3].submenu.push({
                type: 'separator'
            }, {
                label: 'Bring All to Front',
                role: 'front'
            });
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
};
