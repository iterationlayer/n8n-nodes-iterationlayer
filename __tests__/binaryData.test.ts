import { describe, expect, it, vi } from "vitest";
import { toBinaryOutput } from "../nodes/IterationLayer/helpers/binaryData.js";

function createMockExecuteFunctions() {
  return {
    helpers: {
      prepareBinaryData: vi.fn().mockResolvedValue({
        data: "base64data",
        mimeType: "image/png",
        fileName: "output.png",
      }),
    },
  } as never;
}

describe("toBinaryOutput", () => {
  it("converts base64 buffer to n8n binary data with correct file name", async () => {
    const mockExecuteFunctions = createMockExecuteFunctions();
    const base64Input = Buffer.from("test image data").toString("base64");

    const result = await toBinaryOutput(mockExecuteFunctions, base64Input, "image/png", "output");

    expect(result).toHaveProperty("data");
    expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
      expect.any(Buffer),
      "output.png",
      "image/png",
    );
  });

  it("derives correct file extension from mime type", async () => {
    const mockExecuteFunctions = createMockExecuteFunctions();
    const base64Input = Buffer.from("test").toString("base64");

    await toBinaryOutput(mockExecuteFunctions, base64Input, "application/pdf", "document");

    expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
      expect.any(Buffer),
      "document.pdf",
      "application/pdf",
    );
  });

  it("uses .bin extension for unknown mime types", async () => {
    const mockExecuteFunctions = createMockExecuteFunctions();
    const base64Input = Buffer.from("test").toString("base64");

    await toBinaryOutput(mockExecuteFunctions, base64Input, "application/octet-stream", "file");

    expect(mockExecuteFunctions.helpers.prepareBinaryData).toHaveBeenCalledWith(
      expect.any(Buffer),
      "file.bin",
      "application/octet-stream",
    );
  });

  it("correctly decodes base64 input to buffer", async () => {
    const mockExecuteFunctions = createMockExecuteFunctions();
    const originalData = "hello world binary data";
    const base64Input = Buffer.from(originalData).toString("base64");

    await toBinaryOutput(mockExecuteFunctions, base64Input, "image/jpeg", "photo");

    const passedBuffer = mockExecuteFunctions.helpers.prepareBinaryData.mock.calls.at(0)?.at(0);
    expect(passedBuffer?.toString()).toBe(originalData);
  });
});
