"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterationLayer = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const documentExtraction_js_1 = require("./descriptions/documentExtraction.js");
const documentGeneration_js_1 = require("./descriptions/documentGeneration.js");
const documentToMarkdown_js_1 = require("./descriptions/documentToMarkdown.js");
const imageGeneration_js_1 = require("./descriptions/imageGeneration.js");
const imageTransformation_js_1 = require("./descriptions/imageTransformation.js");
const sheetGeneration_js_1 = require("./descriptions/sheetGeneration.js");
const websiteExtraction_js_1 = require("./descriptions/websiteExtraction.js");
const binaryData_js_1 = require("./helpers/binaryData.js");
const fileInput_js_1 = require("./helpers/fileInput.js");
function buildTransformOperation(entry) {
    const operationType = entry.operationType;
    switch (operationType) {
        case "resize":
            return {
                type: "resize",
                width_in_px: entry.widthInPx,
                height_in_px: entry.heightInPx,
                fit: entry.fit,
            };
        case "crop":
            return {
                type: "crop",
                left_in_px: entry.leftInPx,
                top_in_px: entry.topInPx,
                width_in_px: entry.widthInPx,
                height_in_px: entry.heightInPx,
            };
        case "smart_crop":
            return {
                type: "smart_crop",
                width_in_px: entry.widthInPx,
                height_in_px: entry.heightInPx,
            };
        case "extend":
            return {
                type: "extend",
                top_in_px: entry.extendTopInPx,
                bottom_in_px: entry.extendBottomInPx,
                left_in_px: entry.extendLeftInPx,
                right_in_px: entry.extendRightInPx,
                hex_color: entry.hexColor,
            };
        case "trim":
            return { type: "trim", threshold: entry.thresholdValue };
        case "rotate":
            return {
                type: "rotate",
                angle_in_degrees: entry.angleInDegrees,
                hex_color: entry.hexColor,
            };
        case "flip":
            return { type: "flip" };
        case "flop":
            return { type: "flop" };
        case "blur":
            return { type: "blur", sigma: entry.sigma };
        case "sharpen":
            return { type: "sharpen", sigma: entry.sigma };
        case "modulate":
            return {
                type: "modulate",
                brightness: entry.brightness,
                saturation: entry.saturation,
                hue: entry.hue,
            };
        case "tint":
            return { type: "tint", hex_color: entry.tintHexColor };
        case "grayscale":
            return { type: "grayscale" };
        case "invert_colors":
            return { type: "invert_colors" };
        case "auto_contrast":
            return { type: "auto_contrast" };
        case "gamma":
            return { type: "gamma", gamma: entry.gamma };
        case "opacity":
            return { type: "opacity", opacity_in_percent: entry.opacityInPercent };
        case "remove_transparency":
            return { type: "remove_transparency", hex_color: entry.hexColor };
        case "threshold":
            return {
                type: "threshold",
                value: entry.thresholdValue,
                is_grayscale: entry.isGrayscale,
            };
        case "denoise":
            return { type: "denoise", size: entry.denoiseSize };
        case "convert":
            return {
                type: "convert",
                format: entry.convertFormat,
                quality: entry.quality,
            };
        case "upscale":
            return { type: "upscale", factor: entry.upscaleFactor };
        case "compress_to_size":
            return {
                type: "compress_to_size",
                max_file_size_in_bytes: entry.maxFileSizeInBytes,
            };
        case "remove_background":
            return {
                type: "remove_background",
                background_hex_color: entry.hexColor || undefined,
            };
        default:
            return { type: operationType };
    }
}
class IterationLayer {
    description = {
        displayName: "Iteration Layer",
        name: "iterationLayer",
        icon: "file:iterationlayer.svg",
        group: ["transform"],
        version: 1,
        subtitle: '={{ $parameter["resource"] }}',
        description: "Extract data from documents, transform images, generate images, and create documents",
        defaults: {
            name: "Iteration Layer",
        },
        inputs: ["main" /* NodeConnectionType.Main */],
        outputs: ["main" /* NodeConnectionType.Main */],
        credentials: [
            {
                name: "iterationLayerApi",
                required: true,
            },
        ],
        properties: [
            {
                displayName: "Resource",
                name: "resource",
                type: "options",
                noDataExpression: true,
                options: [
                    {
                        name: "Document Extraction",
                        value: "documentExtraction",
                        description: "Extract structured data from documents and images using AI",
                    },
                    {
                        name: "Image Transformation",
                        value: "imageTransformation",
                        description: "Resize, crop, convert, and apply effects to images",
                    },
                    {
                        name: "Image Generation",
                        value: "imageGeneration",
                        description: "Generate images from layer compositions",
                    },
                    {
                        name: "Document Generation",
                        value: "documentGeneration",
                        description: "Generate PDF, DOCX, EPUB, or PPTX documents",
                    },
                    {
                        name: "Document to Markdown",
                        value: "documentToMarkdown",
                        description: "Convert documents to clean, structured Markdown",
                    },
                    {
                        name: "Website Extraction",
                        value: "websiteExtraction",
                        description: "Extract structured data from website URLs",
                    },
                    {
                        name: "Sheet Generation",
                        value: "sheetGeneration",
                        description: "Generate XLSX, CSV, or Markdown spreadsheets",
                    },
                ],
                default: "documentExtraction",
            },
            ...documentExtraction_js_1.documentExtractionProperties,
            ...documentToMarkdown_js_1.documentToMarkdownProperties,
            ...websiteExtraction_js_1.websiteExtractionProperties,
            ...imageTransformation_js_1.imageTransformationProperties,
            ...imageGeneration_js_1.imageGenerationProperties,
            ...documentGeneration_js_1.documentGenerationProperties,
            ...sheetGeneration_js_1.sheetGenerationProperties,
        ],
    };
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const resource = this.getNodeParameter("resource", 0);
        const credentials = (await this.getCredentials("iterationLayerApi"));
        const baseUrl = credentials.baseUrl || "https://api.iterationlayer.com";
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const isAsync = this.getNodeParameter("isAsync", itemIndex, false);
                const maybeWebhookUrl = isAsync
                    ? this.getNodeParameter("webhookUrl", itemIndex)
                    : undefined;
                if (resource === "documentExtraction") {
                    const result = await executeDocumentExtraction(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
                else if (resource === "imageTransformation") {
                    const result = await executeImageTransformation(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
                else if (resource === "imageGeneration") {
                    const result = await executeImageGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
                else if (resource === "documentGeneration") {
                    const result = await executeDocumentGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
                else if (resource === "documentToMarkdown") {
                    const result = await executeDocumentToMarkdown(this, itemIndex, baseUrl);
                    returnData.push(result);
                }
                else if (resource === "websiteExtraction") {
                    const result = await executeWebsiteExtraction(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
                else if (resource === "sheetGeneration") {
                    const result = await executeSheetGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
                    returnData.push(result);
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: itemIndex },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.IterationLayer = IterationLayer;
async function makeApiRequest(executeFunctions, method, endpoint, baseUrl, body) {
    return (await executeFunctions.helpers.httpRequestWithAuthentication.call(executeFunctions, "iterationLayerApi", {
        method: method,
        url: `${baseUrl}${endpoint}`,
        body: body,
        json: true,
    }));
}
function handleApiResponse(executeFunctions, response, itemIndex) {
    if (!response.success) {
        throw new n8n_workflow_1.NodeOperationError(executeFunctions.getNode(), `API error: ${response.error}`, {
            itemIndex,
        });
    }
}
async function executeDocumentExtraction(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const files = await (0, fileInput_js_1.getMultipleFileInputs)(executeFunctions, itemIndex);
    const schemaInputMode = executeFunctions.getNodeParameter("schemaInputMode", itemIndex);
    let schema;
    if (schemaInputMode === "rawJson") {
        const schemaJson = executeFunctions.getNodeParameter("schemaJson", itemIndex);
        schema = (typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson);
    }
    else {
        const schemaFieldsCollection = executeFunctions.getNodeParameter("schemaFields", itemIndex, {});
        const fields = (schemaFieldsCollection.fieldValues ?? []).map((field) => ({
            name: field.name,
            description: field.description,
            type: field.type,
            is_required: field.isRequired,
        }));
        schema = { fields };
    }
    const requestBody = { files, schema };
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/document-extraction/v1/extract", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    return {
        json: response.data,
        pairedItem: { item: itemIndex },
    };
}
async function executeImageTransformation(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const file = await (0, fileInput_js_1.getFileInput)(executeFunctions, itemIndex);
    const operationsCollection = executeFunctions.getNodeParameter("operations", itemIndex, {});
    const operations = (operationsCollection.operationValues ?? []).map((entry) => buildTransformOperation(entry));
    const requestBody = { file, operations };
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/image-transformation/v1/transform", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    const responseData = response.data;
    const binary = await (0, binaryData_js_1.toBinaryOutput)(executeFunctions, responseData.buffer, responseData.mime_type, "transformed");
    return {
        json: { mimeType: responseData.mime_type },
        binary,
        pairedItem: { item: itemIndex },
    };
}
async function executeImageGeneration(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const widthInPx = executeFunctions.getNodeParameter("widthInPx", itemIndex);
    const heightInPx = executeFunctions.getNodeParameter("heightInPx", itemIndex);
    const outputFormat = executeFunctions.getNodeParameter("outputFormat", itemIndex);
    const layersJsonRaw = executeFunctions.getNodeParameter("layersJson", itemIndex);
    const fontsJsonRaw = executeFunctions.getNodeParameter("fontsJson", itemIndex);
    const layers = typeof layersJsonRaw === "string" ? JSON.parse(layersJsonRaw) : layersJsonRaw;
    const fonts = typeof fontsJsonRaw === "string" ? JSON.parse(fontsJsonRaw) : fontsJsonRaw;
    const requestBody = {
        dimensions: {
            width_in_px: widthInPx,
            height_in_px: heightInPx,
        },
        layers,
        output_format: outputFormat,
    };
    if (Array.isArray(fonts) && fonts.length > 0) {
        requestBody.fonts = fonts;
    }
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/image-generation/v1/generate", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    const responseData = response.data;
    const binary = await (0, binaryData_js_1.toBinaryOutput)(executeFunctions, responseData.buffer, responseData.mime_type, "generated");
    return {
        json: { mimeType: responseData.mime_type },
        binary,
        pairedItem: { item: itemIndex },
    };
}
async function executeDocumentGeneration(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const format = executeFunctions.getNodeParameter("format", itemIndex);
    const documentJsonRaw = executeFunctions.getNodeParameter("documentJson", itemIndex);
    const document = typeof documentJsonRaw === "string" ? JSON.parse(documentJsonRaw) : documentJsonRaw;
    const requestBody = { format, document };
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/document-generation/v1/generate", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    const responseData = response.data;
    const binary = await (0, binaryData_js_1.toBinaryOutput)(executeFunctions, responseData.buffer, responseData.mime_type, "document");
    return {
        json: { mimeType: responseData.mime_type },
        binary,
        pairedItem: { item: itemIndex },
    };
}
async function executeDocumentToMarkdown(executeFunctions, itemIndex, baseUrl) {
    const file = await (0, fileInput_js_1.getFileInput)(executeFunctions, itemIndex);
    const requestBody = { file };
    const response = await makeApiRequest(executeFunctions, "POST", "/document-to-markdown/v1/convert", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    return {
        json: response.data,
        pairedItem: { item: itemIndex },
    };
}
async function executeWebsiteExtraction(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const fileUrl = getRequiredNodeParameter(executeFunctions, itemIndex, "fileUrl");
    const fetchOptions = getWebsiteFetchOptions(executeFunctions, itemIndex);
    const schemaInputMode = getRequiredNodeParameter(executeFunctions, itemIndex, "schemaInputMode");
    let schema;
    if (schemaInputMode === "rawJson") {
        const schemaJson = getRequiredNodeParameter(executeFunctions, itemIndex, "schemaJson");
        schema = (typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson);
    }
    else {
        const schemaFieldsCollection = getRequiredNodeParameter("schemaFields", executeFunctions, itemIndex);
        const fields = (schemaFieldsCollection.fieldValues ?? []).map((field) => ({
            name: field.name,
            description: field.description,
            type: field.type,
            is_required: field.isRequired,
        }));
        schema = { fields };
    }
    const requestBody = {
        file: {
            type: "url",
            url: fileUrl,
        },
        schema,
    };
    if (fetchOptions !== undefined) {
        requestBody.file = {
            ...requestBody.file,
            fetch_options: fetchOptions,
        };
    }
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/website-extraction/v1/extract", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    return {
        json: response.data,
        pairedItem: { item: itemIndex },
    };
}
function getWebsiteFetchOptions(executeFunctions, itemIndex) {
    const locale = executeFunctions.getNodeParameter("fileFetchLocale", itemIndex, "");
    const userAgent = executeFunctions.getNodeParameter("fileFetchUserAgent", itemIndex, "");
    const auth = executeFunctions.getNodeParameter("fileFetchAuth", itemIndex, {});
    const headers = executeFunctions.getNodeParameter("fileFetchHeaders", itemIndex, {});
    const timeoutMs = executeFunctions.getNodeParameter("fileFetchTimeoutMs", itemIndex, 0);
    const shouldRenderJavascript = executeFunctions.getNodeParameter("fileFetchShouldRenderJavascript", itemIndex, false);
    const legacyJavascript = executeFunctions.getNodeParameter("fileFetchJavascript", itemIndex, false);
    const fetchOptions = {};
    if (locale !== "") {
        fetchOptions.locale = locale;
    }
    if (userAgent !== "") {
        fetchOptions.user_agent = userAgent;
    }
    const parsedAuth = parseOptionalObject(auth);
    if (parsedAuth !== undefined) {
        fetchOptions.auth = parsedAuth;
    }
    const parsedHeaders = parseOptionalObject(headers);
    if (parsedHeaders !== undefined) {
        fetchOptions.headers = parsedHeaders;
    }
    if (timeoutMs > 0) {
        fetchOptions.timeout_ms = timeoutMs;
    }
    if (shouldRenderJavascript || legacyJavascript) {
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
function getRequiredNodeParameter(first, second, third) {
    const executeFunctions = typeof first === "string" ? second : first;
    const itemIndex = (typeof first === "string" ? third : second);
    const parameterName = (typeof first === "string" ? first : third);
    try {
        return executeFunctions.getNodeParameter(parameterName, itemIndex);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError(executeFunctions.getNode(), `Could not get parameter '${parameterName}'`, { itemIndex, description: error.message });
    }
}
async function executeSheetGeneration(executeFunctions, itemIndex, baseUrl, maybeWebhookUrl) {
    const sheetFormat = executeFunctions.getNodeParameter("sheetFormat", itemIndex);
    const sheetsJsonRaw = executeFunctions.getNodeParameter("sheetsJson", itemIndex);
    const stylesJsonRaw = executeFunctions.getNodeParameter("sheetStylesJson", itemIndex);
    const sheets = typeof sheetsJsonRaw === "string" ? JSON.parse(sheetsJsonRaw) : sheetsJsonRaw;
    const styles = typeof stylesJsonRaw === "string" ? JSON.parse(stylesJsonRaw) : stylesJsonRaw;
    const requestBody = {
        format: sheetFormat,
        sheets,
    };
    if (styles && Object.keys(styles).length > 0) {
        requestBody.styles = styles;
    }
    if (maybeWebhookUrl) {
        requestBody.webhook_url = maybeWebhookUrl;
    }
    const response = await makeApiRequest(executeFunctions, "POST", "/sheet-generation/v1/generate", baseUrl, requestBody);
    handleApiResponse(executeFunctions, response, itemIndex);
    if ("async" in response && response.async) {
        return {
            json: { async: true, message: response.message },
            pairedItem: { item: itemIndex },
        };
    }
    const responseData = response.data;
    const binary = await (0, binaryData_js_1.toBinaryOutput)(executeFunctions, responseData.buffer, responseData.mime_type, "spreadsheet");
    return {
        json: { mimeType: responseData.mime_type },
        binary,
        pairedItem: { item: itemIndex },
    };
}
