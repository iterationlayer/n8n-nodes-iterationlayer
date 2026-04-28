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
    withResourceDisplay(shared_js_1.fileFetchLocaleProperty),
    withResourceDisplay(shared_js_1.fileFetchUserAgentProperty),
    withResourceDisplay(shared_js_1.fileFetchAuthProperty),
    withResourceDisplay(shared_js_1.fileFetchHeadersProperty),
    withResourceDisplay(shared_js_1.fileFetchTimeoutMsProperty),
    withResourceDisplay(shared_js_1.fileFetchShouldRenderJavascriptProperty),
    withResourceDisplay(shared_js_1.fileNameProperty),
];
