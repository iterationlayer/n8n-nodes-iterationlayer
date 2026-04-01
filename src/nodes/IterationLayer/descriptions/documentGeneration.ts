import type { INodeProperties } from "n8n-workflow";

const FORMAT_OPTIONS = [
  { name: "PDF", value: "pdf" },
  { name: "DOCX", value: "docx" },
  { name: "EPUB", value: "epub" },
  { name: "PPTX", value: "pptx" },
];

export const documentGenerationProperties: INodeProperties[] = [
  {
    displayName: "Output Format",
    name: "format",
    type: "options",
    options: FORMAT_OPTIONS,
    default: "pdf",
    description: "The document format to generate",
    displayOptions: {
      show: {
        resource: ["documentGeneration"],
      },
    },
  },
  {
    displayName: "Document (JSON)",
    name: "documentJson",
    type: "json",
    default:
      '{\n  "metadata": { "title": "My Document" },\n  "page": {\n    "size": { "preset": "A4" },\n    "margins": { "top_in_pt": 72, "right_in_pt": 72, "bottom_in_pt": 72, "left_in_pt": 72 }\n  },\n  "styles": {\n    "text": { "font_family": "Helvetica", "font_size_in_pt": 12, "line_height": 1.5, "color": "#000000" },\n    "headline": { "font_family": "Helvetica", "font_size_in_pt": 24, "color": "#000000", "spacing_before_in_pt": 12, "spacing_after_in_pt": 6 },\n    "link": { "color": "#0066CC" },\n    "list": { "indent_in_pt": 18, "spacing_between_items_in_pt": 4 },\n    "table": {\n      "header": { "background_color": "#F0F0F0", "font_family": "Helvetica", "font_size_in_pt": 11, "color": "#000000", "padding_in_pt": 6 },\n      "body": { "font_family": "Helvetica", "font_size_in_pt": 11, "color": "#333333", "padding_in_pt": 6 }\n    },\n    "grid": { "gap_in_pt": 12 },\n    "separator": { "color": "#CCCCCC", "thickness_in_pt": 1, "margin_top_in_pt": 12, "margin_bottom_in_pt": 12 },\n    "image": { "alignment": "center", "margin_top_in_pt": 8, "margin_bottom_in_pt": 8 }\n  },\n  "content": [\n    { "type": "headline", "level": "h1", "text": "Hello World" },\n    { "type": "paragraph", "markdown": "This is a sample document." }\n  ]\n}',
    description:
      "Full document definition as JSON including metadata, page, styles, and content blocks. See https://iterationlayer.com/docs/document-generation for the full schema.",
    displayOptions: {
      show: {
        resource: ["documentGeneration"],
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
        resource: ["documentGeneration"],
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
        resource: ["documentGeneration"],
        isAsync: [true],
      },
    },
  },
];
