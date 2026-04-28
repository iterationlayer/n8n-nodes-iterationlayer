import type { IDataObject, IExecuteFunctions } from "n8n-workflow";

interface FileInputBase64 {
  type: "base64";
  name: string;
  base64: string;
}

interface FileInputUrl {
  type: "url";
  name?: string;
  url: string;
  fetch_options?: {
    auth?: IDataObject;
    headers?: IDataObject;
    locale?: string;
    user_agent?: string;
    timeout_ms?: number;
    should_render_javascript?: boolean;
  };
}

type FileInput = FileInputBase64 | FileInputUrl;

export async function getFileInput(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): Promise<FileInput> {
  const fileInputMode = executeFunctions.getNodeParameter("fileInputMode", itemIndex) as string;
  const fileName = executeFunctions.getNodeParameter("fileName", itemIndex, "") as string;

  if (fileInputMode === "url") {
    const fileUrl = executeFunctions.getNodeParameter("fileUrl", itemIndex) as string;
    const fetchOptions = getFetchOptions({
      locale: executeFunctions.getNodeParameter("fileFetchLocale", itemIndex, "") as string,
      userAgent: executeFunctions.getNodeParameter("fileFetchUserAgent", itemIndex, "") as string,
      auth: executeFunctions.getNodeParameter("fileFetchAuth", itemIndex, {}) as
        | IDataObject
        | string,
      headers: executeFunctions.getNodeParameter("fileFetchHeaders", itemIndex, {}) as
        | IDataObject
        | string,
      timeoutMs: executeFunctions.getNodeParameter("fileFetchTimeoutMs", itemIndex, 0) as number,
      shouldRenderJavascript: executeFunctions.getNodeParameter(
        "fileFetchShouldRenderJavascript",
        itemIndex,
        false,
      ) as boolean,
      legacyJavascript: executeFunctions.getNodeParameter(
        "fileFetchJavascript",
        itemIndex,
        false,
      ) as boolean,
    });

    const urlInput: FileInputUrl = { type: "url", url: fileUrl };

    if ((fileName ?? "") !== "") {
      urlInput.name = fileName;
    }

    if (fetchOptions !== undefined) {
      urlInput.fetch_options = fetchOptions;
    }

    return urlInput;
  }

  const binaryPropertyName = executeFunctions.getNodeParameter(
    "fileBinaryPropertyName",
    itemIndex,
  ) as string;
  const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(
    itemIndex,
    binaryPropertyName,
  );

  return {
    type: "base64",
    name: fileName,
    base64: binaryData.toString("base64"),
  };
}

export async function getMultipleFileInputs(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): Promise<FileInput[]> {
  const filesCollection = executeFunctions.getNodeParameter("files", itemIndex, {}) as {
    fileValues?: Array<{
      fileInputMode: string;
      fileBinaryPropertyName?: string;
      fileUrl?: string;
      fileName?: string;
      fileFetchLocale?: string;
      fileFetchUserAgent?: string;
      fileFetchAuth?: IDataObject | string;
      fileFetchHeaders?: IDataObject | string;
      fileFetchTimeoutMs?: number;
      fileFetchShouldRenderJavascript?: boolean;
      fileFetchJavascript?: boolean;
    }>;
  };

  const fileEntries = filesCollection.fileValues ?? [];

  const fileInputs: FileInput[] = [];

  for (const entry of fileEntries) {
    if (entry.fileInputMode === "url") {
      const fetchOptions = getFetchOptions({
        locale: entry.fileFetchLocale,
        userAgent: entry.fileFetchUserAgent,
        auth: entry.fileFetchAuth,
        headers: entry.fileFetchHeaders,
        timeoutMs: entry.fileFetchTimeoutMs,
        shouldRenderJavascript: entry.fileFetchShouldRenderJavascript,
        legacyJavascript: entry.fileFetchJavascript,
      });
      const urlInput: FileInputUrl = {
        type: "url",
        url: entry.fileUrl ?? "",
      };

      if ((entry.fileName ?? "") !== "") {
        urlInput.name = entry.fileName;
      }

      if (fetchOptions !== undefined) {
        urlInput.fetch_options = fetchOptions;
      }

      fileInputs.push(urlInput);
    } else {
      const binaryPropertyName = entry.fileBinaryPropertyName ?? "data";
      const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(
        itemIndex,
        binaryPropertyName,
      );
      fileInputs.push({
        type: "base64",
        name: entry.fileName ?? "input.bin",
        base64: binaryData.toString("base64"),
      });
    }
  }

  return fileInputs;
}

function getFetchOptions(options: {
  locale?: string;
  userAgent?: string;
  auth?: IDataObject | string;
  headers?: IDataObject | string;
  timeoutMs?: number;
  shouldRenderJavascript?: boolean;
  legacyJavascript?: boolean;
}): FileInputUrl["fetch_options"] | undefined {
  const fetchOptions: NonNullable<FileInputUrl["fetch_options"]> = {};

  if ((options.locale ?? "") !== "") {
    fetchOptions.locale = options.locale;
  }

  if ((options.userAgent ?? "") !== "") {
    fetchOptions.user_agent = options.userAgent;
  }

  const auth = parseOptionalObject(options.auth);

  if (auth !== undefined) {
    fetchOptions.auth = auth;
  }

  const headers = parseOptionalObject(options.headers);

  if (headers !== undefined) {
    fetchOptions.headers = headers;
  }

  if ((options.timeoutMs ?? 0) > 0) {
    fetchOptions.timeout_ms = options.timeoutMs;
  }

  if (options.shouldRenderJavascript === true || options.legacyJavascript === true) {
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
