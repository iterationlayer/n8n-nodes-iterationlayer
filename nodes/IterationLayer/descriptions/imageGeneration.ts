import type { INodeProperties } from "n8n-workflow";

const DEFAULT_LAYERS = [
  {
    type: "solid-color",
    index: 0,
    hex_color: "#FFFFFF",
    position: { x: 0, y: 0 },
    dimensions: { width: 1_200, height: 630 },
  },
  {
    type: "text",
    index: 1,
    text: "Hello World",
    font_name: "Roboto",
    font_size_in_px: 48,
    text_color: "#000000",
    position: { x: 50, y: 50 },
    dimensions: { width: 1_100, height: 100 },
  },
];

const OUTPUT_FORMAT_OPTIONS = [
  { name: "PNG", value: "png" },
  { name: "JPEG", value: "jpeg" },
  { name: "WebP", value: "webp" },
  { name: "TIFF", value: "tiff" },
  { name: "GIF", value: "gif" },
  { name: "AVIF", value: "avif" },
];

export const imageGenerationProperties: INodeProperties[] = [
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
    default: JSON.stringify(DEFAULT_LAYERS, null, 2),
    description:
      "JSON array of layers. Supports types: solid-color, text, image, qr-code, barcode, gradient. See https://iterationlayer.com/docs/image-generation for the full schema.",
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
    description:
      "Optional JSON array of custom font definitions with name, weight, style, and file (base64 or URL).",
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
