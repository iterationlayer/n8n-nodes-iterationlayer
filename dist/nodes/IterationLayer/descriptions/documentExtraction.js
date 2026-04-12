"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentExtractionProperties = void 0;
const FIELD_TYPE_OPTIONS = [
    { name: "Text", value: "TEXT" },
    { name: "Textarea", value: "TEXTAREA" },
    { name: "Integer", value: "INTEGER" },
    { name: "Decimal", value: "DECIMAL" },
    { name: "Date", value: "DATE" },
    { name: "Datetime", value: "DATETIME" },
    { name: "Time", value: "TIME" },
    { name: "Enum", value: "ENUM" },
    { name: "Boolean", value: "BOOLEAN" },
    { name: "Email", value: "EMAIL" },
    { name: "IBAN", value: "IBAN" },
    { name: "Country", value: "COUNTRY" },
    { name: "Currency Code", value: "CURRENCY_CODE" },
    { name: "Currency Amount", value: "CURRENCY_AMOUNT" },
    { name: "Address", value: "ADDRESS" },
    { name: "Array", value: "ARRAY" },
    { name: "Calculated", value: "CALCULATED" },
];
exports.documentExtractionProperties = [
    {
        displayName: "Files",
        name: "files",
        type: "fixedCollection",
        typeOptions: { multipleValues: true },
        default: {},
        placeholder: "Add File",
        description: "Files to extract data from",
        displayOptions: {
            show: {
                resource: ["documentExtraction"],
            },
        },
        options: [
            {
                displayName: "File",
                name: "fileValues",
                values: [
                    {
                        displayName: "File Input Mode",
                        name: "fileInputMode",
                        type: "options",
                        options: [
                            { name: "Binary Data from Previous Node", value: "binaryData" },
                            { name: "URL", value: "url" },
                        ],
                        default: "binaryData",
                    },
                    {
                        displayName: "Binary Property",
                        name: "fileBinaryPropertyName",
                        type: "string",
                        default: "data",
                        displayOptions: { show: { fileInputMode: ["binaryData"] } },
                    },
                    {
                        displayName: "File URL",
                        name: "fileUrl",
                        type: "string",
                        default: "",
                        placeholder: "https://example.com/document.pdf",
                        displayOptions: { show: { fileInputMode: ["url"] } },
                    },
                    {
                        displayName: "File Name",
                        name: "fileName",
                        type: "string",
                        default: "",
                        placeholder: "invoice.pdf",
                        description: "File name with extension",
                    },
                ],
            },
        ],
    },
    {
        displayName: "Schema Input Mode",
        name: "schemaInputMode",
        type: "options",
        options: [
            { name: "UI Builder", value: "uiBuilder" },
            { name: "Raw JSON", value: "rawJson" },
        ],
        default: "uiBuilder",
        description: "Use the UI builder for simple schemas, or raw JSON for advanced features like nested arrays and calculated fields.",
        displayOptions: {
            show: {
                resource: ["documentExtraction"],
            },
        },
    },
    {
        displayName: "Schema Fields",
        name: "schemaFields",
        type: "fixedCollection",
        typeOptions: { multipleValues: true },
        default: {},
        placeholder: "Add Field",
        description: "Fields to extract from the document",
        displayOptions: {
            show: {
                resource: ["documentExtraction"],
                schemaInputMode: ["uiBuilder"],
            },
        },
        options: [
            {
                displayName: "Field",
                name: "fieldValues",
                values: [
                    {
                        displayName: "Name",
                        name: "name",
                        type: "string",
                        default: "",
                        placeholder: "invoice_number",
                        description: "Machine-readable field name",
                    },
                    {
                        displayName: "Description",
                        name: "description",
                        type: "string",
                        default: "",
                        placeholder: "The invoice number from the document header",
                        description: "Describes what to extract — the more specific, the better",
                    },
                    {
                        displayName: "Type",
                        name: "type",
                        type: "options",
                        options: FIELD_TYPE_OPTIONS,
                        default: "TEXT",
                    },
                    {
                        displayName: "Required",
                        name: "isRequired",
                        type: "boolean",
                        default: false,
                        description: "Whether this field must be found in the document",
                    },
                ],
            },
        ],
    },
    {
        displayName: "Schema JSON",
        name: "schemaJson",
        type: "json",
        default: '{\n  "fields": [\n    {\n      "name": "invoice_number",\n      "type": "TEXT",\n      "description": "The invoice number"\n    }\n  ]\n}',
        description: "Full schema as JSON. Required for advanced field types like ARRAY (nested schemas) and CALCULATED fields.",
        displayOptions: {
            show: {
                resource: ["documentExtraction"],
                schemaInputMode: ["rawJson"],
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
                resource: ["documentExtraction"],
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
                resource: ["documentExtraction"],
                isAsync: [true],
            },
        },
    },
];
