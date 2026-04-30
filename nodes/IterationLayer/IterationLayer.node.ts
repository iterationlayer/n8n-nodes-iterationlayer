import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { NodeConnectionType, NodeOperationError } from "n8n-workflow";
import { documentExtractionProperties } from "./descriptions/documentExtraction.js";
import { documentGenerationProperties } from "./descriptions/documentGeneration.js";
import { documentToMarkdownProperties } from "./descriptions/documentToMarkdown.js";
import { imageGenerationProperties } from "./descriptions/imageGeneration.js";
import { imageTransformationProperties } from "./descriptions/imageTransformation.js";
import { sheetGenerationProperties } from "./descriptions/sheetGeneration.js";
import { websiteExtractionProperties } from "./descriptions/websiteExtraction.js";
import { toBinaryOutput } from "./helpers/binaryData.js";
import { getFileInput, getMultipleFileInputs } from "./helpers/fileInput.js";

interface ApiSuccessResponse {
  success: true;
  data: IDataObject;
}

interface ApiAsyncResponse {
  success: true;
  async: true;
  message: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse = ApiSuccessResponse | ApiAsyncResponse | ApiErrorResponse;

interface OperationEntry {
  operationType: string;
  widthInPx?: number;
  heightInPx?: number;
  fit?: string;
  leftInPx?: number;
  topInPx?: number;
  angleInDegrees?: number;
  hexColor?: string;
  sigma?: number;
  brightness?: number;
  saturation?: number;
  hue?: number;
  tintHexColor?: string;
  gamma?: number;
  opacityInPercent?: number;
  thresholdValue?: number;
  isGrayscale?: boolean;
  denoiseSize?: number;
  convertFormat?: string;
  quality?: number;
  upscaleFactor?: number;
  maxFileSizeInBytes?: number;
  extendTopInPx?: number;
  extendBottomInPx?: number;
  extendLeftInPx?: number;
  extendRightInPx?: number;
}

function buildTransformOperation(entry: OperationEntry): Record<string, unknown> {
  const operationType = entry.operationType;

  switch (operationType) {
    case "resize":
      return {
        type: "resize",
        width_in_px: entry.widthInPx,
        height_in_px: entry.heightInPx,
        fit: entry.fit,
      };
    case "crop":
      return {
        type: "crop",
        left_in_px: entry.leftInPx,
        top_in_px: entry.topInPx,
        width_in_px: entry.widthInPx,
        height_in_px: entry.heightInPx,
      };
    case "smart_crop":
      return {
        type: "smart_crop",
        width_in_px: entry.widthInPx,
        height_in_px: entry.heightInPx,
      };
    case "extend":
      return {
        type: "extend",
        top_in_px: entry.extendTopInPx,
        bottom_in_px: entry.extendBottomInPx,
        left_in_px: entry.extendLeftInPx,
        right_in_px: entry.extendRightInPx,
        hex_color: entry.hexColor,
      };
    case "trim":
      return { type: "trim", threshold: entry.thresholdValue };
    case "rotate":
      return {
        type: "rotate",
        angle_in_degrees: entry.angleInDegrees,
        hex_color: entry.hexColor,
      };
    case "flip":
      return { type: "flip" };
    case "flop":
      return { type: "flop" };
    case "blur":
      return { type: "blur", sigma: entry.sigma };
    case "sharpen":
      return { type: "sharpen", sigma: entry.sigma };
    case "modulate":
      return {
        type: "modulate",
        brightness: entry.brightness,
        saturation: entry.saturation,
        hue: entry.hue,
      };
    case "tint":
      return { type: "tint", hex_color: entry.tintHexColor };
    case "grayscale":
      return { type: "grayscale" };
    case "invert_colors":
      return { type: "invert_colors" };
    case "auto_contrast":
      return { type: "auto_contrast" };
    case "gamma":
      return { type: "gamma", gamma: entry.gamma };
    case "opacity":
      return { type: "opacity", opacity_in_percent: entry.opacityInPercent };
    case "remove_transparency":
      return { type: "remove_transparency", hex_color: entry.hexColor };
    case "threshold":
      return {
        type: "threshold",
        value: entry.thresholdValue,
        is_grayscale: entry.isGrayscale,
      };
    case "denoise":
      return { type: "denoise", size: entry.denoiseSize };
    case "convert":
      return {
        type: "convert",
        format: entry.convertFormat,
        quality: entry.quality,
      };
    case "upscale":
      return { type: "upscale", factor: entry.upscaleFactor };
    case "compress_to_size":
      return {
        type: "compress_to_size",
        max_file_size_in_bytes: entry.maxFileSizeInBytes,
      };
    case "remove_background":
      return {
        type: "remove_background",
        background_hex_color: entry.hexColor || undefined,
      };
    default:
      return { type: operationType };
  }
}

export class IterationLayer implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Iteration Layer",
    name: "iterationLayer",
    icon: "file:iterationlayer.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{ $parameter["resource"] }}',
    description:
      "Extract data from documents, transform images, generate images, and create documents",
    defaults: {
      name: "Iteration Layer",
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: "iterationLayerApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Document Extraction",
            value: "documentExtraction",
            description: "Extract structured data from documents and images using AI",
          },
          {
            name: "Image Transformation",
            value: "imageTransformation",
            description: "Resize, crop, convert, and apply effects to images",
          },
          {
            name: "Image Generation",
            value: "imageGeneration",
            description: "Generate images from layer compositions",
          },
          {
            name: "Document Generation",
            value: "documentGeneration",
            description: "Generate PDF, DOCX, EPUB, or PPTX documents",
          },
          {
            name: "Document to Markdown",
            value: "documentToMarkdown",
            description: "Convert documents to clean, structured Markdown",
          },
          {
            name: "Website Extraction",
            value: "websiteExtraction",
            description: "Extract structured data from website URLs",
          },
          {
            name: "Sheet Generation",
            value: "sheetGeneration",
            description: "Generate XLSX, CSV, or Markdown spreadsheets",
          },
        ],
        default: "documentExtraction",
      },
      ...documentExtractionProperties,
      ...documentToMarkdownProperties,
      ...websiteExtractionProperties,
      ...imageTransformationProperties,
      ...imageGenerationProperties,
      ...documentGenerationProperties,
      ...sheetGenerationProperties,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter("resource", 0) as string;
    const credentials = (await this.getCredentials("iterationLayerApi")) as {
      apiKey: string;
      baseUrl: string;
    };
    const baseUrl = credentials.baseUrl || "https://api.iterationlayer.com";

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const isAsync = this.getNodeParameter("isAsync", itemIndex, false) as boolean;
        const maybeWebhookUrl = isAsync
          ? (this.getNodeParameter("webhookUrl", itemIndex) as string)
          : undefined;

        if (resource === "documentExtraction") {
          const result = await executeDocumentExtraction(this, itemIndex, baseUrl, maybeWebhookUrl);
          returnData.push(result);
        } else if (resource === "imageTransformation") {
          const result = await executeImageTransformation(
            this,
            itemIndex,
            baseUrl,
            maybeWebhookUrl,
          );
          returnData.push(result);
        } else if (resource === "imageGeneration") {
          const result = await executeImageGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
          returnData.push(result);
        } else if (resource === "documentGeneration") {
          const result = await executeDocumentGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
          returnData.push(result);
        } else if (resource === "documentToMarkdown") {
          const result = await executeDocumentToMarkdown(this, itemIndex, baseUrl);
          returnData.push(result);
        } else if (resource === "websiteExtraction") {
          const result = await executeWebsiteExtraction(this, itemIndex, baseUrl, maybeWebhookUrl);
          returnData.push(result);
        } else if (resource === "sheetGeneration") {
          const result = await executeSheetGeneration(this, itemIndex, baseUrl, maybeWebhookUrl);
          returnData.push(result);
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: itemIndex },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

async function makeApiRequest(
  executeFunctions: IExecuteFunctions,
  method: string,
  endpoint: string,
  baseUrl: string,
  body: IDataObject,
): Promise<ApiResponse> {
  return (await executeFunctions.helpers.httpRequestWithAuthentication.call(
    executeFunctions,
    "iterationLayerApi",
    {
      method: method as IHttpRequestMethods,
      url: `${baseUrl}${endpoint}`,
      headers: { "X-IterationLayer-Integration": "n8n" },
      body: body as IDataObject,
      json: true,
    },
  )) as ApiResponse;
}

function handleApiResponse(
  executeFunctions: IExecuteFunctions,
  response: ApiResponse,
  itemIndex: number,
): void {
  if (!response.success) {
    throw new NodeOperationError(executeFunctions.getNode(), `API error: ${response.error}`, {
      itemIndex,
    });
  }
}

async function executeDocumentExtraction(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const files = await getMultipleFileInputs(executeFunctions, itemIndex);
  const schemaInputMode = executeFunctions.getNodeParameter("schemaInputMode", itemIndex) as string;

  let schema: IDataObject;

  if (schemaInputMode === "rawJson") {
    const schemaJson = executeFunctions.getNodeParameter("schemaJson", itemIndex) as string;
    schema = (typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson) as IDataObject;
  } else {
    const schemaFieldsCollection = executeFunctions.getNodeParameter(
      "schemaFields",
      itemIndex,
      {},
    ) as {
      fieldValues?: Array<{
        name: string;
        description: string;
        type: string;
        isRequired: boolean;
      }>;
    };

    const fields = (schemaFieldsCollection.fieldValues ?? []).map((field) => ({
      name: field.name,
      description: field.description,
      type: field.type,
      is_required: field.isRequired,
    }));

    schema = { fields };
  }

  const requestBody = { files, schema } as unknown as IDataObject;
  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/document-extraction/v1/extract",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  return {
    json: (response as ApiSuccessResponse).data,
    pairedItem: { item: itemIndex },
  };
}

async function executeImageTransformation(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const file = await getFileInput(executeFunctions, itemIndex);
  const operationsCollection = executeFunctions.getNodeParameter("operations", itemIndex, {}) as {
    operationValues?: OperationEntry[];
  };

  const operations = (operationsCollection.operationValues ?? []).map((entry) =>
    buildTransformOperation(entry),
  );

  const requestBody = { file, operations } as unknown as IDataObject;
  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/image-transformation/v1/transform",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  const responseData = (response as ApiSuccessResponse).data as {
    buffer: string;
    mime_type: string;
  };
  const binary = await toBinaryOutput(
    executeFunctions,
    responseData.buffer,
    responseData.mime_type,
    "transformed",
  );

  return {
    json: { mimeType: responseData.mime_type },
    binary,
    pairedItem: { item: itemIndex },
  };
}

async function executeImageGeneration(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const widthInPx = executeFunctions.getNodeParameter("widthInPx", itemIndex) as number;
  const heightInPx = executeFunctions.getNodeParameter("heightInPx", itemIndex) as number;
  const outputFormat = executeFunctions.getNodeParameter("outputFormat", itemIndex) as string;
  const layersJsonRaw = executeFunctions.getNodeParameter("layersJson", itemIndex) as string;
  const fontsJsonRaw = executeFunctions.getNodeParameter("fontsJson", itemIndex) as string;

  const layers = typeof layersJsonRaw === "string" ? JSON.parse(layersJsonRaw) : layersJsonRaw;
  const fonts = typeof fontsJsonRaw === "string" ? JSON.parse(fontsJsonRaw) : fontsJsonRaw;

  const requestBody = {
    dimensions: {
      width_in_px: widthInPx,
      height_in_px: heightInPx,
    },
    layers,
    output_format: outputFormat,
  } as unknown as IDataObject;

  if (Array.isArray(fonts) && fonts.length > 0) {
    requestBody.fonts = fonts;
  }

  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/image-generation/v1/generate",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  const responseData = (response as ApiSuccessResponse).data as {
    buffer: string;
    mime_type: string;
  };
  const binary = await toBinaryOutput(
    executeFunctions,
    responseData.buffer,
    responseData.mime_type,
    "generated",
  );

  return {
    json: { mimeType: responseData.mime_type },
    binary,
    pairedItem: { item: itemIndex },
  };
}

async function executeDocumentGeneration(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const format = executeFunctions.getNodeParameter("format", itemIndex) as string;
  const documentJsonRaw = executeFunctions.getNodeParameter("documentJson", itemIndex) as string;
  const document =
    typeof documentJsonRaw === "string" ? JSON.parse(documentJsonRaw) : documentJsonRaw;

  const requestBody = { format, document } as unknown as IDataObject;
  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/document-generation/v1/generate",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  const responseData = (response as ApiSuccessResponse).data as {
    buffer: string;
    mime_type: string;
  };
  const binary = await toBinaryOutput(
    executeFunctions,
    responseData.buffer,
    responseData.mime_type,
    "document",
  );

  return {
    json: { mimeType: responseData.mime_type },
    binary,
    pairedItem: { item: itemIndex },
  };
}

async function executeDocumentToMarkdown(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
): Promise<INodeExecutionData> {
  const file = await getFileInput(executeFunctions, itemIndex);

  const requestBody = { file } as unknown as IDataObject;

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/document-to-markdown/v1/convert",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  return {
    json: (response as ApiSuccessResponse).data,
    pairedItem: { item: itemIndex },
  };
}

async function executeWebsiteExtraction(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const fileUrl = getRequiredNodeParameter(executeFunctions, itemIndex, "fileUrl") as string;
  const fetchOptions = getWebsiteFetchOptions(executeFunctions, itemIndex);

  const schemaInputMode = getRequiredNodeParameter(
    executeFunctions,
    itemIndex,
    "schemaInputMode",
  ) as string;

  let schema: IDataObject;

  if (schemaInputMode === "rawJson") {
    const schemaJson = getRequiredNodeParameter(
      executeFunctions,
      itemIndex,
      "schemaJson",
    ) as string;
    schema = (typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson) as IDataObject;
  } else {
    const schemaFieldsCollection = getRequiredNodeParameter(
      "schemaFields",
      executeFunctions,
      itemIndex,
    ) as {
      fieldValues?: Array<{
        name: string;
        description: string;
        type: string;
        isRequired: boolean;
      }>;
    };

    const fields = (schemaFieldsCollection.fieldValues ?? []).map((field) => ({
      name: field.name,
      description: field.description,
      type: field.type,
      is_required: field.isRequired,
    }));

    schema = { fields };
  }

  const requestBody = {
    file: {
      type: "url",
      url: fileUrl,
    },
    schema,
  } as unknown as IDataObject;

  if (fetchOptions !== undefined) {
    requestBody.file = {
      ...(requestBody.file as IDataObject),
      fetch_options: fetchOptions,
    };
  }

  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/website-extraction/v1/extract",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  return {
    json: (response as ApiSuccessResponse).data,
    pairedItem: { item: itemIndex },
  };
}

function getWebsiteFetchOptions(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): IDataObject | undefined {
  const locale = executeFunctions.getNodeParameter("fileFetchLocale", itemIndex, "") as string;
  const userAgent = executeFunctions.getNodeParameter(
    "fileFetchUserAgent",
    itemIndex,
    "",
  ) as string;
  const auth = executeFunctions.getNodeParameter("fileFetchAuth", itemIndex, {}) as
    | IDataObject
    | string;
  const headers = executeFunctions.getNodeParameter("fileFetchHeaders", itemIndex, {}) as
    | IDataObject
    | string;
  const timeoutMs = executeFunctions.getNodeParameter("fileFetchTimeoutMs", itemIndex, 0) as number;
  const shouldRenderJavascript = executeFunctions.getNodeParameter(
    "fileFetchShouldRenderJavascript",
    itemIndex,
    false,
  ) as boolean;
  const legacyJavascript = executeFunctions.getNodeParameter(
    "fileFetchJavascript",
    itemIndex,
    false,
  ) as boolean;

  const fetchOptions = {} as IDataObject;

  if (locale !== "") {
    fetchOptions.locale = locale;
  }

  if (userAgent !== "") {
    fetchOptions.user_agent = userAgent;
  }

  const parsedAuth = parseOptionalObject(auth);

  if (parsedAuth !== undefined) {
    fetchOptions.auth = parsedAuth;
  }

  const parsedHeaders = parseOptionalObject(headers);

  if (parsedHeaders !== undefined) {
    fetchOptions.headers = parsedHeaders;
  }

  if (timeoutMs > 0) {
    fetchOptions.timeout_ms = timeoutMs;
  }

  if (shouldRenderJavascript || legacyJavascript) {
    fetchOptions.should_render_javascript = true;
  }

  if (Object.keys(fetchOptions).length === 0) {
    return undefined;
  }

  return fetchOptions;
}

function parseOptionalObject(value: IDataObject | string | undefined): IDataObject | undefined {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return undefined;
    }

    return parseOptionalObject(JSON.parse(trimmedValue) as IDataObject);
  }

  if (value === undefined || Object.keys(value).length === 0) {
    return undefined;
  }

  return value;
}

function getRequiredNodeParameter(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  parameterName: string,
): unknown;
function getRequiredNodeParameter(
  parameterName: string,
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): unknown;
function getRequiredNodeParameter(
  first: IExecuteFunctions | string,
  second: number | IExecuteFunctions,
  third: string | number,
): unknown {
  const executeFunctions =
    typeof first === "string" ? (second as IExecuteFunctions) : (first as IExecuteFunctions);
  const itemIndex = (typeof first === "string" ? third : second) as number;
  const parameterName = (typeof first === "string" ? first : third) as string;

  try {
    return executeFunctions.getNodeParameter(parameterName, itemIndex);
  } catch (error) {
    throw new NodeOperationError(
      executeFunctions.getNode(),
      `Could not get parameter '${parameterName}'`,
      { itemIndex, description: (error as Error).message },
    );
  }
}

async function executeSheetGeneration(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
  maybeWebhookUrl: string | undefined,
): Promise<INodeExecutionData> {
  const sheetFormat = executeFunctions.getNodeParameter("sheetFormat", itemIndex) as string;
  const sheetsJsonRaw = executeFunctions.getNodeParameter("sheetsJson", itemIndex) as string;
  const stylesJsonRaw = executeFunctions.getNodeParameter("sheetStylesJson", itemIndex) as string;

  const sheets = typeof sheetsJsonRaw === "string" ? JSON.parse(sheetsJsonRaw) : sheetsJsonRaw;
  const styles = typeof stylesJsonRaw === "string" ? JSON.parse(stylesJsonRaw) : stylesJsonRaw;

  const requestBody = {
    format: sheetFormat,
    sheets,
  } as unknown as IDataObject;

  if (styles && Object.keys(styles).length > 0) {
    requestBody.styles = styles;
  }

  if (maybeWebhookUrl) {
    requestBody.webhook_url = maybeWebhookUrl;
  }

  const response = await makeApiRequest(
    executeFunctions,
    "POST",
    "/sheet-generation/v1/generate",
    baseUrl,
    requestBody,
  );

  handleApiResponse(executeFunctions, response, itemIndex);

  if ("async" in response && response.async) {
    return {
      json: { async: true, message: response.message },
      pairedItem: { item: itemIndex },
    };
  }

  const responseData = (response as ApiSuccessResponse).data as {
    buffer: string;
    mime_type: string;
  };
  const binary = await toBinaryOutput(
    executeFunctions,
    responseData.buffer,
    responseData.mime_type,
    "spreadsheet",
  );

  return {
    json: { mimeType: responseData.mime_type },
    binary,
    pairedItem: { item: itemIndex },
  };
}
