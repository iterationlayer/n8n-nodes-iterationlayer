import type { IBinaryKeyData, IExecuteFunctions } from "n8n-workflow";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/heif": "heif",
  "image/tiff": "tiff",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/epub+zip": "epub",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export async function toBinaryOutput(
  executeFunctions: IExecuteFunctions,
  base64Buffer: string,
  mimeType: string,
  fileBaseName: string,
): Promise<IBinaryKeyData> {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "bin";
  const fileName = `${fileBaseName}.${extension}`;
  const buffer = Buffer.from(base64Buffer, "base64");
  const binaryData = await executeFunctions.helpers.prepareBinaryData(buffer, fileName, mimeType);

  return { data: binaryData };
}
