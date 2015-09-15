/**
 * A helper module for displaying messages with the intent of keeping application logic
 * and localizable strings separate.
 */

function prettyProgressMessage(message, speed, progress) {
    message = (speed) ? message + speed + ' ' : message;
    message = (progress) ? message + progress + '%' : message;

    return message;
}

export default {
    downloadMessage: function (blobName, speed, progress) {
        return prettyProgressMessage('Downloading Blob ' + blobName + ' ', speed, progress);
    },
    uploadMessage: function (filePath, azurePath, speed, progress) {
        return prettyProgressMessage('Uploading file ' + filePath + ' to ' + azurePath + ' ', speed, progress);
    },
    copyMessage: function (fileName, azurePath, speed, progress) {
        return prettyProgressMessage('Copying file ' + fileName + ' to ' + azurePath + ' ', speed, progress);
    },
    deleteBlobMessage: function (blobName) {
        return 'Deleting Blob ' + blobName;
    },
    addContainerMessage: function (containerName) {
        return 'Adding Container ' + containerName;
    },
    deleteContainerMessage: function (containerName) {
        return 'Deleting Container ' + containerName;
    },
    updateBlobPropsMessage: function (blobName) {
        return 'Updating Blob Properties for ' + blobName;
    },
    updateContainerACLMessage: function (containerName) {
        return 'Updating Access Control Level for ' + containerName;
    },
    updateServiceSettings: function () {
        return 'Updating Service Settings';
    },
    storageHostConnectionErrorMessage: function (storageDnsSuffix) {
        return 'Connection to ' + storageDnsSuffix + ' failed. Please check your internet connection, the account name, and/or DNS suffix is correct before trying again. ';
    },
    storageInvalidAccountKey: function () {
        return 'The provided account key is invalid. Please check it and try again.';
    },
    storageRejectedAccountKey: function () {
        return 'The connection succeeded, but the Azure rejected the account key. Please check it and try again.';
    },
	containerNameInvalidMessage : function () {
		return 'Invalid name - must conform to valid DNS names, lower case, 3 <= n <= 63, dashes';
	}
};
