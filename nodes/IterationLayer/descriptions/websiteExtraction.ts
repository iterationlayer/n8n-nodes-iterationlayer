import type { INodeProperties } from "n8n-workflow";
import {
  asyncModeProperty,
  fileFetchAuthProperty,
  fileFetchHeadersProperty,
  fileFetchShouldRenderJavascriptProperty,
  fileFetchTimeoutMsProperty,
  fileFetchUserAgentProperty,
  webhookUrlProperty,
} from "./shared.js";

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

function withResourceDisplay(property: INodeProperties): INodeProperties {
  return {
    ...property,
    displayOptions: {
      ...property.displayOptions,
      show: {
        ...property.displayOptions?.show,
        resource: ["websiteExtraction"],
      },
    },
  };
}

export const websiteExtractionProperties: INodeProperties[] = [
  {
    displayName: "File URL",
    name: "fileUrl",
    type: "string",
    default: "",
    placeholder: "https://example.com",
    description: "Public website URL to extract from",
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
      },
    },
  },
  {
    displayName: "Locale",
    name: "fileFetchLocale",
    type: "string",
    default: "",
    description: "Optional locale for website retrieval",
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
      },
    },
  },
  {
    ...fileFetchUserAgentProperty,
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
      },
    },
  },
  withResourceDisplay(fileFetchTimeoutMsProperty),
  withResourceDisplay(fileFetchAuthProperty),
  withResourceDisplay(fileFetchHeadersProperty),
  withResourceDisplay(fileFetchShouldRenderJavascriptProperty),
  {
    displayName: "Schema Input Mode",
    name: "schemaInputMode",
    type: "options",
    options: [
      { name: "UI Builder", value: "uiBuilder" },
      { name: "Raw JSON", value: "rawJson" },
    ],
    default: "uiBuilder",
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
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
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
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
          },
          {
            displayName: "Description",
            name: "description",
            type: "string",
            default: "",
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
          },
        ],
      },
    ],
  },
  {
    displayName: "Schema JSON",
    name: "schemaJson",
    type: "json",
    default: JSON.stringify(
      {
        fields: [
          {
            name: "title",
            type: "TEXT",
            description: "The page title",
          },
        ],
      },
      null,
      2,
    ),
    displayOptions: {
      show: {
        resource: ["websiteExtraction"],
        schemaInputMode: ["rawJson"],
      },
    },
  },
  withResourceDisplay(asyncModeProperty),
  withResourceDisplay(webhookUrlProperty),
];
