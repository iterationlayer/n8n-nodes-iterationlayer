import type { INodeProperties } from "n8n-workflow";
import {
  fileBinaryPropertyNameProperty,
  fileInputModeProperty,
  fileNameProperty,
  fileUrlProperty,
} from "./shared.js";

const OPERATION_TYPE_OPTIONS = [
  { name: "Resize", value: "resize" },
  { name: "Crop", value: "crop" },
  { name: "Smart Crop", value: "smart_crop" },
  { name: "Extend", value: "extend" },
  { name: "Trim", value: "trim" },
  { name: "Rotate", value: "rotate" },
  { name: "Flip (Vertical)", value: "flip" },
  { name: "Flop (Horizontal)", value: "flop" },
  { name: "Blur", value: "blur" },
  { name: "Sharpen", value: "sharpen" },
  { name: "Modulate", value: "modulate" },
  { name: "Tint", value: "tint" },
  { name: "Grayscale", value: "grayscale" },
  { name: "Invert Colors", value: "invert_colors" },
  { name: "Auto Contrast", value: "auto_contrast" },
  { name: "Gamma", value: "gamma" },
  { name: "Opacity", value: "opacity" },
  { name: "Remove Transparency", value: "remove_transparency" },
  { name: "Threshold", value: "threshold" },
  { name: "Denoise", value: "denoise" },
  { name: "Convert Format", value: "convert" },
  { name: "Upscale", value: "upscale" },
  { name: "Compress to Size", value: "compress_to_size" },
  { name: "Remove Background", value: "remove_background" },
];

const FIT_OPTIONS = [
  { name: "Cover", value: "cover" },
  { name: "Contain", value: "contain" },
  { name: "Fill", value: "fill" },
  { name: "Inside", value: "inside" },
  { name: "Outside", value: "outside" },
];

const FORMAT_OPTIONS = [
  { name: "PNG", value: "png" },
  { name: "JPEG", value: "jpeg" },
  { name: "WebP", value: "webp" },
  { name: "AVIF", value: "avif" },
  { name: "HEIF", value: "heif" },
];

const UPSCALE_FACTOR_OPTIONS = [
  { name: "2x", value: 2 },
  { name: "3x", value: 3 },
  { name: "4x", value: 4 },
];

function withResourceDisplay(property: INodeProperties): INodeProperties {
  return {
    ...property,
    displayOptions: {
      ...property.displayOptions,
      show: {
        ...property.displayOptions?.show,
        resource: ["imageTransformation"],
      },
    },
  };
}

export const imageTransformationProperties: INodeProperties[] = [
  withResourceDisplay(fileInputModeProperty),
  withResourceDisplay(fileBinaryPropertyNameProperty),
  withResourceDisplay(fileUrlProperty),
  withResourceDisplay(fileNameProperty),
  {
    displayName: "Operations",
    name: "operations",
    type: "fixedCollection",
    typeOptions: { multipleValues: true },
    default: {},
    placeholder: "Add Operation",
    description: "Image transformation operations to apply sequentially",
    displayOptions: {
      show: {
        resource: ["imageTransformation"],
      },
    },
    options: [
      {
        displayName: "Operation",
        name: "operationValues",
        values: [
          {
            displayName: "Type",
            name: "operationType",
            type: "options",
            options: OPERATION_TYPE_OPTIONS,
            default: "resize",
          },
          {
            displayName: "Width (px)",
            name: "widthInPx",
            type: "number",
            default: 800,
            displayOptions: {
              show: {
                operationType: ["resize", "crop", "smart_crop"],
              },
            },
          },
          {
            displayName: "Height (px)",
            name: "heightInPx",
            type: "number",
            default: 600,
            displayOptions: {
              show: {
                operationType: ["resize", "crop", "smart_crop"],
              },
            },
          },
          {
            displayName: "Fit",
            name: "fit",
            type: "options",
            options: FIT_OPTIONS,
            default: "cover",
            displayOptions: {
              show: { operationType: ["resize"] },
            },
          },
          {
            displayName: "Left (px)",
            name: "leftInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["crop"] },
            },
          },
          {
            displayName: "Top (px)",
            name: "topInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["crop"] },
            },
          },
          {
            displayName: "Angle (Degrees)",
            name: "angleInDegrees",
            type: "number",
            default: 90,
            displayOptions: {
              show: { operationType: ["rotate"] },
            },
          },
          {
            displayName: "Background Color",
            name: "hexColor",
            type: "string",
            default: "#FFFFFF",
            description: "Hex color for the background",
            displayOptions: {
              show: {
                operationType: ["rotate", "extend", "remove_transparency", "remove_background"],
              },
            },
          },
          {
            displayName: "Sigma",
            name: "sigma",
            type: "number",
            default: 3,
            displayOptions: {
              show: { operationType: ["blur", "sharpen"] },
            },
          },
          {
            displayName: "Brightness",
            name: "brightness",
            type: "number",
            default: 1,
            description: "Brightness multiplier (1 = unchanged)",
            displayOptions: {
              show: { operationType: ["modulate"] },
            },
          },
          {
            displayName: "Saturation",
            name: "saturation",
            type: "number",
            default: 1,
            description: "Saturation multiplier (1 = unchanged)",
            displayOptions: {
              show: { operationType: ["modulate"] },
            },
          },
          {
            displayName: "Hue",
            name: "hue",
            type: "number",
            default: 0,
            description: "Hue rotation in degrees",
            displayOptions: {
              show: { operationType: ["modulate"] },
            },
          },
          {
            displayName: "Tint Color",
            name: "tintHexColor",
            type: "string",
            default: "#FF0000",
            displayOptions: {
              show: { operationType: ["tint"] },
            },
          },
          {
            displayName: "Gamma",
            name: "gamma",
            type: "number",
            default: 2.2,
            displayOptions: {
              show: { operationType: ["gamma"] },
            },
          },
          {
            displayName: "Opacity (%)",
            name: "opacityInPercent",
            type: "number",
            default: 50,
            typeOptions: { minValue: 0, maxValue: 100 },
            displayOptions: {
              show: { operationType: ["opacity"] },
            },
          },
          {
            displayName: "Threshold",
            name: "thresholdValue",
            type: "number",
            default: 128,
            displayOptions: {
              show: { operationType: ["threshold", "trim"] },
            },
          },
          {
            displayName: "Grayscale",
            name: "isGrayscale",
            type: "boolean",
            default: true,
            displayOptions: {
              show: { operationType: ["threshold"] },
            },
          },
          {
            displayName: "Denoise Size",
            name: "denoiseSize",
            type: "number",
            default: 3,
            displayOptions: {
              show: { operationType: ["denoise"] },
            },
          },
          {
            displayName: "Output Format",
            name: "convertFormat",
            type: "options",
            options: FORMAT_OPTIONS,
            default: "webp",
            displayOptions: {
              show: { operationType: ["convert"] },
            },
          },
          {
            displayName: "Quality",
            name: "quality",
            type: "number",
            default: 85,
            typeOptions: { minValue: 1, maxValue: 100 },
            description: "Output quality (1-100)",
            displayOptions: {
              show: { operationType: ["convert"] },
            },
          },
          {
            displayName: "Upscale Factor",
            name: "upscaleFactor",
            type: "options",
            options: UPSCALE_FACTOR_OPTIONS,
            default: 2,
            displayOptions: {
              show: { operationType: ["upscale"] },
            },
          },
          {
            displayName: "Max File Size (Bytes)",
            name: "maxFileSizeInBytes",
            type: "number",
            default: 500_000,
            description: "Target maximum file size in bytes",
            displayOptions: {
              show: { operationType: ["compress_to_size"] },
            },
          },
          {
            displayName: "Top (px)",
            name: "extendTopInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["extend"] },
            },
          },
          {
            displayName: "Bottom (px)",
            name: "extendBottomInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["extend"] },
            },
          },
          {
            displayName: "Left (px)",
            name: "extendLeftInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["extend"] },
            },
          },
          {
            displayName: "Right (px)",
            name: "extendRightInPx",
            type: "number",
            default: 0,
            displayOptions: {
              show: { operationType: ["extend"] },
            },
          },
        ],
      },
    ],
  },
  {
    displayName: "Async Mode",
    name: "isAsync",
    type: "boolean",
    default: false,
    description: "Whether to process asynchronously. Results will be delivered to the webhook URL.",
    displayOptions: {
      show: {
        resource: ["imageTransformation"],
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
        resource: ["imageTransformation"],
        isAsync: [true],
      },
    },
  },
];
