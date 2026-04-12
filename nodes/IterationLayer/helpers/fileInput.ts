import type { IExecuteFunctions } from "n8n-workflow";

interface FileInputBase64 {
  type: "base64";
  name: string;
  base64: string;
}

interface FileInputUrl {
  type: "url";
  name: string;
  url: string;
}

type FileInput = FileInputBase64 | FileInputUrl;

export async function getFileInput(
  executeFunctions: IExecuteFunctions,
  itemIndex: number,
): Promise<FileInput> {
  const fileInputMode = executeFunctions.getNodeParameter("fileInputMode", itemIndex) as string;
  const fileName = executeFunctions.getNodeParameter("fileName", itemIndex) as string;

  if (fileInputMode === "url") {
    const fileUrl = executeFunctions.getNodeParameter("fileUrl", itemIndex) as string;

    return { type: "url", name: fileName, url: fileUrl };
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
      fileName: string;
    }>;
  };

  const fileEntries = filesCollection.fileValues ?? [];

  const fileInputs: FileInput[] = [];

  for (const entry of fileEntries) {
    if (entry.fileInputMode === "url") {
      fileInputs.push({
        type: "url",
        name: entry.fileName,
        url: entry.fileUrl ?? "",
      });
    } else {
      const binaryPropertyName = entry.fileBinaryPropertyName ?? "data";
      const binaryData = await executeFunctions.helpers.getBinaryDataBuffer(
        itemIndex,
        binaryPropertyName,
      );
      fileInputs.push({
        type: "base64",
        name: entry.fileName,
        base64: binaryData.toString("base64"),
      });
    }
  }

  return fileInputs;
}
