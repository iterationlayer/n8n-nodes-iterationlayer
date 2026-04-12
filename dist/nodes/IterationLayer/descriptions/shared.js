"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookUrlProperty = exports.asyncModeProperty = exports.fileNameProperty = exports.fileUrlProperty = exports.fileBinaryPropertyNameProperty = exports.fileInputModeProperty = void 0;
exports.fileInputModeProperty = {
    displayName: "File Input Mode",
    name: "fileInputMode",
    type: "options",
    options: [
        {
            name: "Binary Data from Previous Node",
            value: "binaryData",
        },
        {
            name: "URL",
            value: "url",
        },
    ],
    default: "binaryData",
    description: "How to provide the input file",
};
exports.fileBinaryPropertyNameProperty = {
    displayName: "Binary Property",
    name: "fileBinaryPropertyName",
    type: "string",
    default: "data",
    description: "The name of the binary property containing the file data",
    displayOptions: {
        show: {
            fileInputMode: ["binaryData"],
        },
    },
};
exports.fileUrlProperty = {
    displayName: "File URL",
    name: "fileUrl",
    type: "string",
    default: "",
    placeholder: "https://example.com/document.pdf",
    description: "Publicly accessible URL of the file",
    displayOptions: {
        show: {
            fileInputMode: ["url"],
        },
    },
};
exports.fileNameProperty = {
    displayName: "File Name",
    name: "fileName",
    type: "string",
    default: "",
    placeholder: "document.pdf",
    description: "Name of the file including extension (e.g., invoice.pdf). Used to determine the file type.",
};
exports.asyncModeProperty = {
    displayName: "Async Mode",
    name: "isAsync",
    type: "boolean",
    default: false,
    description: "Whether to process the request asynchronously. When enabled, the API returns immediately and delivers results to the webhook URL.",
};
exports.webhookUrlProperty = {
    displayName: "Webhook URL",
    name: "webhookUrl",
    type: "string",
    default: "",
    placeholder: "https://your-app.com/webhooks/result",
    description: "HTTPS URL where the result will be delivered when processing is complete",
    displayOptions: {
        show: {
            isAsync: [true],
        },
    },
};
