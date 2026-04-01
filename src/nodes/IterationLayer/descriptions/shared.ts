import type { INodeProperties } from "n8n-workflow";

export const fileInputModeProperty: INodeProperties = {
  displayName: "File Input Mode",
  name: "fileInputMode",
  type: "options",
  options: [
    {
      name: "Binary Data from Previous Node",
      value: "binaryData",
    },
    {
      name: "URL",
      value: "url",
    },
  ],
  default: "binaryData",
  description: "How to provide the input file",
};

export const fileBinaryPropertyNameProperty: INodeProperties = {
  displayName: "Binary Property",
  name: "fileBinaryPropertyName",
  type: "string",
  default: "data",
  description: "The name of the binary property containing the file data",
  displayOptions: {
    show: {
      fileInputMode: ["binaryData"],
    },
  },
};

export const fileUrlProperty: INodeProperties = {
  displayName: "File URL",
  name: "fileUrl",
  type: "string",
  default: "",
  placeholder: "https://example.com/document.pdf",
  description: "Publicly accessible URL of the file",
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileNameProperty: INodeProperties = {
  displayName: "File Name",
  name: "fileName",
  type: "string",
  default: "",
  placeholder: "document.pdf",
  description:
    "Name of the file including extension (e.g., invoice.pdf). Used to determine the file type.",
};

export const asyncModeProperty: INodeProperties = {
  displayName: "Async Mode",
  name: "isAsync",
  type: "boolean",
  default: false,
  description:
    "Whether to process the request asynchronously. When enabled, the API returns immediately and delivers results to the webhook URL.",
};

export const webhookUrlProperty: INodeProperties = {
  displayName: "Webhook URL",
  name: "webhookUrl",
  type: "string",
  default: "",
  placeholder: "https://your-app.com/webhooks/result",
  description: "HTTPS URL where the result will be delivered when processing is complete",
  displayOptions: {
    show: {
      isAsync: [true],
    },
  },
};
