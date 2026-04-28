"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileInput = getFileInput;
exports.getMultipleFileInputs = getMultipleFileInputs;
async function getFileInput(executeFunctions, itemIndex) {
    const fileInputMode = executeFunctions.getNodeParameter("fileInputMode", itemIndex);
    const fileName = executeFunctions.getNodeParameter("fileName", itemIndex, "");
    if (fileInputMode === "url") {
        const fileUrl = executeFunctions.getNodeParameter("fileUrl", itemIndex);
        const fetchOptions = getFetchOptions({
            locale: executeFunctions.getNodeParameter("fileFetchLocale", itemIndex, ""),
            userAgent: executeFunctions.getNodeParameter("fileFetchUserAgent", itemIndex, ""),
            auth: executeFunctions.getNodeParameter("fileFetchAuth", itemIndex, {}),
            headers: executeFunctions.getNodeParameter("fileFetchHeaders", itemIndex, {}),
            timeoutMs: executeFunctions.getNodeParameter("fileFetchTimeoutMs", itemIndex, 0),
            shouldRenderJavascript: executeFunctions.getNodeParameter("fileFetchShouldRenderJavascript", itemIndex, false),
            legacyJavascript: executeFunctions.getNodeParameter("fileFetchJavascript", itemIndex, false),
        });
        const urlInput = { type: "url", url: fileUrl };
        if ((fileName ?? "") !== "") {
            urlInput.name = fileName;
        }
        if (fetchOptions !== undefined) {
            urlInput.fetch_options = fetchOptions;
        }
        return urlInput;
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
            const fetchOptions = getFetchOptions({
                locale: entry.fileFetchLocale,
                userAgent: entry.fileFetchUserAgent,
                auth: entry.fileFetchAuth,
                headers: entry.fileFetchHeaders,
                timeoutMs: entry.fileFetchTimeoutMs,
                shouldRenderJavascript: entry.fileFetchShouldRenderJavascript,
                legacyJavascript: entry.fileFetchJavascript,
            });
            const urlInput = {
                type: "url",
                url: entry.fileUrl ?? "",
            };
            if ((entry.fileName ?? "") !== "") {
                urlInput.name = entry.fileName;
            }
            if (fetchOptions !== undefined) {
                urlInput.fetch_options = fetchOptions;
            }
            fileInputs.push(urlInput);
        }
        else {
            const binaryPropertyName = entry.fileBinaryPropertyName ?? "data";
            const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
            fileInputs.push({
                type: "base64",
                name: entry.fileName ?? "input.bin",
                base64: binaryData.toString("base64"),
            });
        }
    }
    return fileInputs;
}
function getFetchOptions(options) {
    const fetchOptions = {};
    if ((options.locale ?? "") !== "") {
        fetchOptions.locale = options.locale;
    }
    if ((options.userAgent ?? "") !== "") {
        fetchOptions.user_agent = options.userAgent;
    }
    const auth = parseOptionalObject(options.auth);
    if (auth !== undefined) {
        fetchOptions.auth = auth;
    }
    const headers = parseOptionalObject(options.headers);
    if (headers !== undefined) {
        fetchOptions.headers = headers;
    }
    if ((options.timeoutMs ?? 0) > 0) {
        fetchOptions.timeout_ms = options.timeoutMs;
    }
    if (options.shouldRenderJavascript === true || options.legacyJavascript === true) {
        fetchOptions.should_render_javascript = true;
    }
    if (Object.keys(fetchOptions).length === 0) {
        return undefined;
    }
    return fetchOptions;
}
function parseOptionalObject(value) {
    if (typeof value === "string") {
        const trimmedValue = value.trim();
        if (trimmedValue === "") {
            return undefined;
        }
        return parseOptionalObject(JSON.parse(trimmedValue));
    }
    if (value === undefined || Object.keys(value).length === 0) {
        return undefined;
    }
    return value;
}
