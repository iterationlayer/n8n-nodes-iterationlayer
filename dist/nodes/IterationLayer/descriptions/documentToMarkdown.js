"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentToMarkdownProperties = void 0;
const shared_js_1 = require("./shared.js");
function withResourceDisplay(property) {
    return {
        ...property,
        displayOptions: {
            ...property.displayOptions,
            show: {
                ...property.displayOptions?.show,
                resource: ["documentToMarkdown"],
            },
        },
    };
}
exports.documentToMarkdownProperties = [
    withResourceDisplay(shared_js_1.fileInputModeProperty),
    withResourceDisplay(shared_js_1.fileBinaryPropertyNameProperty),
    withResourceDisplay(shared_js_1.fileUrlProperty),
    withResourceDisplay(shared_js_1.fileNameProperty),
];
