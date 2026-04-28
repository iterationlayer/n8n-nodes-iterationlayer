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

export const fileFetchLocaleProperty: INodeProperties = {
  displayName: "Locale",
  name: "fileFetchLocale",
  type: "string",
  default: "",
  description: "Optional locale for website retrieval",
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileFetchUserAgentProperty: INodeProperties = {
  displayName: "User Agent",
  name: "fileFetchUserAgent",
  type: "string",
  default: "",
  description: "Optional custom user agent for website retrieval",
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileFetchAuthProperty: INodeProperties = {
  displayName: "Auth",
  name: "fileFetchAuth",
  type: "json",
  default: "{}",
  description: 'Optional website authentication, for example {"type":"bearer","token":"..."}',
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileFetchHeadersProperty: INodeProperties = {
  displayName: "Headers",
  name: "fileFetchHeaders",
  type: "json",
  default: "{}",
  description: 'Optional website request headers, for example {"x-api-key":"..."}',
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileFetchTimeoutMsProperty: INodeProperties = {
  displayName: "Timeout (Ms)",
  name: "fileFetchTimeoutMs",
  type: "number",
  default: 0,
  description: "Optional website fetch timeout in milliseconds. Leave 0 to use the API default.",
  displayOptions: {
    show: {
      fileInputMode: ["url"],
    },
  },
};

export const fileFetchShouldRenderJavascriptProperty: INodeProperties = {
  displayName: "Render JavaScript",
  name: "fileFetchShouldRenderJavascript",
  type: "boolean",
  default: false,
  description: "Use Chromium browser rendering before extraction",
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
    "Optional file name including extension (e.g., invoice.pdf). Used to determine the file type for file URLs.",
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
