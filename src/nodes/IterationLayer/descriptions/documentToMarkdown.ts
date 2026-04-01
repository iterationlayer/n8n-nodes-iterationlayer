import type { INodeProperties } from "n8n-workflow";
import {
  fileBinaryPropertyNameProperty,
  fileInputModeProperty,
  fileNameProperty,
  fileUrlProperty,
} from "./shared.js";

function withResourceDisplay(property: INodeProperties): INodeProperties {
  return {
    ...property,
    displayOptions: {
      ...property.displayOptions,
      show: {
        ...property.displayOptions?.show,
        resource: ["documentToMarkdown"],
      },
    },
  };
}

export const documentToMarkdownProperties: INodeProperties[] = [
  withResourceDisplay(fileInputModeProperty),
  withResourceDisplay(fileBinaryPropertyNameProperty),
  withResourceDisplay(fileUrlProperty),
  withResourceDisplay(fileNameProperty),
];
