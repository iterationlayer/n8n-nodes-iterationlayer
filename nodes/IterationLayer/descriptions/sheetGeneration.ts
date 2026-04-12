import type { INodeProperties } from "n8n-workflow";

const FORMAT_OPTIONS = [
  { name: "XLSX", value: "xlsx" },
  { name: "CSV", value: "csv" },
  { name: "Markdown", value: "markdown" },
];

export const sheetGenerationProperties: INodeProperties[] = [
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
    default:
      '[\n  {\n    "name": "Sheet 1",\n    "columns": [\n      {\n        "name": "Name"\n      },\n      {\n        "name": "Amount"\n      }\n    ],\n    "rows": [\n      [\n        "Item A",\n        100\n      ],\n      [\n        "Item B",\n        200\n      ]\n    ]\n  }\n]',
    description:
      "JSON array of sheets. Each sheet has a name, columns (with name and optional width), and rows of cell values. See https://iterationlayer.com/docs/sheet-generation for the full schema.",
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
