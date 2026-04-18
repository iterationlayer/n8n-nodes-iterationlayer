"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetGenerationProperties = void 0;
const DEFAULT_SHEETS = [
    {
        name: "Sheet 1",
        columns: [{ name: "Name" }, { name: "Amount" }],
        rows: [
            ["Item A", 100],
            ["Item B", 200],
        ],
    },
];
const FORMAT_OPTIONS = [
    { name: "XLSX", value: "xlsx" },
    { name: "CSV", value: "csv" },
    { name: "Markdown", value: "markdown" },
];
exports.sheetGenerationProperties = [
    {
        displayName: "Output Format",
        name: "sheetFormat",
        type: "options",
        options: FORMAT_OPTIONS,
        default: "xlsx",
        description: "The spreadsheet format to generate",
        displayOptions: {
            show: {
                resource: ["sheetGeneration"],
            },
        },
    },
    {
        displayName: "Sheets (JSON)",
        name: "sheetsJson",
        type: "json",
        default: JSON.stringify(DEFAULT_SHEETS, null, 2),
        description: "JSON array of sheets. Each sheet has a name, columns (with name and optional width), and rows of cell values. See https://iterationlayer.com/docs/sheet-generation for the full schema.",
        displayOptions: {
            show: {
                resource: ["sheetGeneration"],
            },
        },
    },
    {
        displayName: "Styles (JSON)",
        name: "sheetStylesJson",
        type: "json",
        default: "{}",
        description: "Optional JSON object with header and body cell styles.",
        displayOptions: {
            show: {
                resource: ["sheetGeneration"],
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
                resource: ["sheetGeneration"],
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
                resource: ["sheetGeneration"],
                isAsync: [true],
            },
        },
    },
];
