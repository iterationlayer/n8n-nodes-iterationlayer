"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileInput = getFileInput;
exports.getMultipleFileInputs = getMultipleFileInputs;
async function getFileInput(executeFunctions, itemIndex) {
    const fileInputMode = executeFunctions.getNodeParameter("fileInputMode", itemIndex);
    const fileName = executeFunctions.getNodeParameter("fileName", itemIndex);
    if (fileInputMode === "url") {
        const fileUrl = executeFunctions.getNodeParameter("fileUrl", itemIndex);
        return { type: "url", name: fileName, url: fileUrl };
    }
    const binaryPropertyName = executeFunctions.getNodeParameter("fileBinaryPropertyName", itemIndex);
    const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
    return {
        type: "base64",
        name: fileName,
        base64: binaryData.toString("base64"),
    };
}
async function getMultipleFileInputs(executeFunctions, itemIndex) {
    const filesCollection = executeFunctions.getNodeParameter("files", itemIndex, {});
    const fileEntries = filesCollection.fileValues ?? [];
    const fileInputs = [];
    for (const entry of fileEntries) {
        if (entry.fileInputMode === "url") {
            fileInputs.push({
                type: "url",
                name: entry.fileName,
                url: entry.fileUrl ?? "",
            });
        }
        else {
            const binaryPropertyName = entry.fileBinaryPropertyName ?? "data";
            const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
            fileInputs.push({
                type: "base64",
                name: entry.fileName,
                base64: binaryData.toString("base64"),
            });
        }
    }
    return fileInputs;
}
