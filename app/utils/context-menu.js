import Ember from 'ember';

/**
 * This setups Electron's context menu
 */
function ContextMenu() {
    var remote = requireNode('remote'),
        Menu = remote.require('menu'),
        MenuItem = remote.require('menu-item');

    let newMenu = new Menu();
    let cut = new MenuItem({label: 'Cut', click: () => document.execCommand('cut')});
    let copy = new MenuItem({label: 'Copy', click: () => document.execCommand('copy')});
    let paste = new MenuItem({label: 'Paste', click: () => document.execCommand('paste')});

    newMenu.append(cut);
    newMenu.append(copy);
    newMenu.append(paste);

    return newMenu;
}

export default {
    /**
     * Opens the properties modal on the explorer controller, if a blob is contextMenu-clicked
     */
    _setup_property_menu: function (e, menu) {
        var el = document.elementFromPoint(e.originalEvent.x, e.originalEvent.y),
            blobContext = (el.getAttribute('data-context') && el.getAttribute('data-context') === 'blob'),
            containerContext = (el.getAttribute('data-context') && el.getAttribute('data-context') === 'container');

        let remote = requireNode('remote');
        let MenuItem = remote.require('menu-item');

        if (blobContext) {
            menu.append(new MenuItem({
                label: 'Properties',
                click: function () {
                    var controller = window.Azureexplorer.__container__.lookup('controller:explorer');
                    if (controller) {
                        controller.send('openModal', '#modal-blob-properties', false);
                    }
                }
            }));
        } else if (containerContext) {
            menu.append(new MenuItem({
                label: 'Properties',
                click: function () {
                    var controller = window.Azureexplorer.__container__.lookup('controller:explorer');
                    if (controller) {
                        controller.send('openModal', '#modal-container-properties', false);
                    }
                }
            }));
        }
    },

    /**
     * Listens to the contextmenu event to provide a customized context menu
     */
    setup: function () {
        var remote = requireNode('remote');

        Ember.$(document).on('contextmenu', (e) => {
            e.preventDefault();
            var menu = new ContextMenu();
            this._setup_property_menu(e, menu);
            menu.popup(remote.getCurrentWindow());
        });
    }
};
