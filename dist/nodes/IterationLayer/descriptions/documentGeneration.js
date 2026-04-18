"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentGenerationProperties = void 0;
const DEFAULT_BORDER_SIDE = { color: "#CCCCCC", width_in_pt: 1 };
const DEFAULT_INNER_BORDER = { color: "#CCCCCC", width_in_pt: 0.5 };
const DEFAULT_DOCUMENT = {
    metadata: { title: "My Document" },
    page: {
        size: { preset: "A4" },
        margins: { top_in_pt: 72, right_in_pt: 72, bottom_in_pt: 72, left_in_pt: 72 },
    },
    styles: {
        text: {
            font_family: "Helvetica",
            font_size_in_pt: 12,
            line_height: 1.5,
            color: "#000000",
        },
        headline: {
            font_family: "Helvetica",
            font_size_in_pt: 24,
            color: "#000000",
            spacing_before_in_pt: 12,
            spacing_after_in_pt: 6,
        },
        link: {
            color: "#0066CC",
        },
        list: {
            marker_color: "#000000",
            marker_gap_in_pt: 6,
            text_style: {
                font_family: "Helvetica",
                font_size_in_pt: 12,
                line_height: 1.5,
                color: "#000000",
            },
        },
        table: {
            header: {
                background_color: "#F0F0F0",
                text_color: "#000000",
                font_size_in_pt: 11,
                padding_in_pt: 6,
            },
            body: {
                background_color: "#FFFFFF",
                text_color: "#333333",
                font_size_in_pt: 11,
                padding_in_pt: 6,
            },
            border: {
                outer: {
                    top: DEFAULT_BORDER_SIDE,
                    right: DEFAULT_BORDER_SIDE,
                    bottom: DEFAULT_BORDER_SIDE,
                    left: DEFAULT_BORDER_SIDE,
                },
                inner: {
                    horizontal: DEFAULT_INNER_BORDER,
                    vertical: DEFAULT_INNER_BORDER,
                },
            },
        },
        grid: {
            gap_in_pt: 12,
            background_color: "#FFFFFF",
            border_color: "#CCCCCC",
            border_width_in_pt: 0,
        },
        separator: {
            color: "#CCCCCC",
            thickness_in_pt: 1,
            spacing_before_in_pt: 12,
            spacing_after_in_pt: 12,
        },
        image: {
            border_color: "#CCCCCC",
            border_width_in_pt: 0,
        },
    },
    content: [
        {
            type: "headline",
            level: "h1",
            text: "Hello World",
        },
        {
            type: "paragraph",
            markdown: "This is a sample document.",
        },
    ],
};
const FORMAT_OPTIONS = [
    { name: "PDF", value: "pdf" },
    { name: "DOCX", value: "docx" },
    { name: "EPUB", value: "epub" },
    { name: "PPTX", value: "pptx" },
];
exports.documentGenerationProperties = [
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
        default: JSON.stringify(DEFAULT_DOCUMENT, null, 2),
        description: "Full document definition as JSON including metadata, page, styles, and content blocks. See https://iterationlayer.com/docs/document-generation for the full schema.",
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
