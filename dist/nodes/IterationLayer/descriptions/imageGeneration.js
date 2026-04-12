"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageGenerationProperties = void 0;
const OUTPUT_FORMAT_OPTIONS = [
    { name: "PNG", value: "png" },
    { name: "JPEG", value: "jpeg" },
    { name: "WebP", value: "webp" },
    { name: "TIFF", value: "tiff" },
    { name: "GIF", value: "gif" },
    { name: "AVIF", value: "avif" },
];
exports.imageGenerationProperties = [
    {
        displayName: "Width (px)",
        name: "widthInPx",
        type: "number",
        default: 1200,
        description: "Output image width in pixels",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Height (px)",
        name: "heightInPx",
        type: "number",
        default: 630,
        description: "Output image height in pixels",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Output Format",
        name: "outputFormat",
        type: "options",
        options: OUTPUT_FORMAT_OPTIONS,
        default: "png",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Layers (JSON)",
        name: "layersJson",
        type: "json",
        default: '[\n  {\n    "type": "solid-color",\n    "index": 0,\n    "hex_color": "#FFFFFF",\n    "position": { "x_in_px": 0, "y_in_px": 0 },\n    "dimensions": { "width_in_px": 1200, "height_in_px": 630 }\n  },\n  {\n    "type": "text",\n    "index": 1,\n    "text": "Hello World",\n    "font_name": "Roboto",\n    "font_size_in_px": 48,\n    "text_color": "#000000",\n    "position": { "x_in_px": 50, "y_in_px": 50 },\n    "dimensions": { "width_in_px": 1100, "height_in_px": 100 }\n  }\n]',
        description: "JSON array of layers. Supports types: solid-color, text, image, qr-code, barcode, gradient. See https://iterationlayer.com/docs/image-generation for the full schema.",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Fonts (JSON)",
        name: "fontsJson",
        type: "json",
        default: "[]",
        description: "Optional JSON array of custom font definitions with name, weight, style, and file (base64 or URL).",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Async Mode",
        name: "isAsync",
        type: "boolean",
        default: false,
        description: "Whether to process asynchronously. Results will be delivered to the webhook URL.",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
            },
        },
    },
    {
        displayName: "Webhook URL",
        name: "webhookUrl",
        type: "string",
        default: "",
        placeholder: "https://your-app.com/webhooks/result",
        description: "HTTPS URL for async result delivery",
        displayOptions: {
            show: {
                resource: ["imageGeneration"],
                isAsync: [true],
            },
        },
    },
];
