import { describe, expect, it, vi } from "vitest";
import {
  getFileInput,
  getMultipleFileInputs,
} from "../src/nodes/IterationLayer/helpers/fileInput.js";

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
      fileName: "document.pdf",
      fileUrl: "https://example.com/document.pdf",
    });

    const result = await getFileInput(mockFunctions, 0);

    expect(result).toEqual({
      type: "url",
      name: "document.pdf",
      url: "https://example.com/document.pdf",
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
            fileName: "doc1.pdf",
            fileUrl: "https://example.com/doc1.pdf",
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
      name: "doc1.pdf",
      url: "https://example.com/doc1.pdf",
    });
    expect(result.at(1)).toEqual({
      type: "base64",
      name: "doc2.pdf",
      base64: Buffer.from("binary file content").toString("base64"),
    });
  });
});
