import { describe, expect, it, vi } from "vitest";
import { getFileInput, getMultipleFileInputs } from "../nodes/IterationLayer/helpers/fileInput.js";

function createMockExecuteFunctions(params: Record<string, unknown> = {}) {
  return {
    getNodeParameter: vi.fn().mockImplementation((name: string) => params[name]),
    helpers: {
      getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from("binary file content")),
    },
  } as never;
}

describe("getFileInput", () => {
  it("returns URL file input when mode is url", async () => {
    const mockFunctions = createMockExecuteFunctions({
      fileInputMode: "url",
      fileUrl: "https://example.com/document.pdf",
      fileFetchLocale: "de-DE",
      fileFetchAuth: { type: "bearer", token: "secret-token" },
      fileFetchHeaders: { "x-tenant-id": "tenant-123" },
      fileFetchTimeoutMs: 10_000,
    });

    const result = await getFileInput(mockFunctions, 0);

    expect(result).toEqual({
      type: "url",
      url: "https://example.com/document.pdf",
      fetch_options: {
        auth: { type: "bearer", token: "secret-token" },
        headers: { "x-tenant-id": "tenant-123" },
        locale: "de-DE",
        timeout_ms: 10_000,
      },
    });
  });

  it("returns base64 file input when mode is binaryData", async () => {
    const mockFunctions = createMockExecuteFunctions({
      fileInputMode: "binaryData",
      fileName: "photo.jpg",
      fileBinaryPropertyName: "data",
    });

    const result = await getFileInput(mockFunctions, 0);

    expect(result).toEqual({
      type: "base64",
      name: "photo.jpg",
      base64: Buffer.from("binary file content").toString("base64"),
    });
    expect(mockFunctions.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, "data");
  });
});

describe("getMultipleFileInputs", () => {
  it("returns empty array when no files provided", async () => {
    const mockFunctions = createMockExecuteFunctions({
      files: {},
    });

    const result = await getMultipleFileInputs(mockFunctions, 0);

    expect(result).toEqual([]);
  });

  it("converts multiple file entries", async () => {
    const mockFunctions = createMockExecuteFunctions({
      files: {
        fileValues: [
          {
            fileInputMode: "url",
            fileUrl: "https://example.com/doc1.pdf",
            fileFetchAuth: { type: "custom_header", name: "x-api-key", value: "secret-key" },
            fileFetchHeaders: { "x-tenant-id": "tenant-123" },
            fileFetchShouldRenderJavascript: true,
          },
          {
            fileInputMode: "binaryData",
            fileBinaryPropertyName: "data",
            fileName: "doc2.pdf",
          },
        ],
      },
    });

    const result = await getMultipleFileInputs(mockFunctions, 0);

    expect(result).toHaveLength(2);
    expect(result.at(0)).toEqual({
      type: "url",
      url: "https://example.com/doc1.pdf",
      fetch_options: {
        auth: { type: "custom_header", name: "x-api-key", value: "secret-key" },
        headers: { "x-tenant-id": "tenant-123" },
        should_render_javascript: true,
      },
    });
    expect(result.at(1)).toEqual({
      type: "base64",
      name: "doc2.pdf",
      base64: Buffer.from("binary file content").toString("base64"),
    });
  });
});
