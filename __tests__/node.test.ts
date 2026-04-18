import { describe, expect, it, vi } from "vitest";
import { IterationLayer } from "../nodes/IterationLayer/IterationLayer.node.js";

function createMockExecuteFunctions(
  params: Record<string, unknown>,
  apiResponse: unknown,
  credentialOverrides: Record<string, unknown> = {},
) {
  const getNodeParameter = vi
    .fn()
    .mockImplementation((name: string, _index: number, fallback?: unknown) => {
      if (name in params) {
        return params[name];
      }

      return fallback;
    });

  return {
    getInputData: vi.fn().mockReturnValue([{ json: {} }]),
    getNodeParameter,
    getCredentials: vi.fn().mockResolvedValue({
      apiKey: "il_test_key",
      baseUrl: "https://api.iterationlayer.com",
      ...credentialOverrides,
    }),
    getNode: vi.fn().mockReturnValue({ name: "Iteration Layer" }),
    continueOnFail: vi.fn().mockReturnValue(false),
    helpers: {
      httpRequestWithAuthentication: vi.fn().mockResolvedValue(apiResponse),
      prepareBinaryData: vi.fn().mockResolvedValue({
        data: "binary",
        mimeType: "image/png",
        fileName: "output.png",
      }),
      getBinaryDataBuffer: vi.fn().mockResolvedValue(Buffer.from("file content")),
    },
  };
}

const BINARY_API_RESPONSE = {
  success: true,
  data: {
    buffer: Buffer.from("binary output").toString("base64"),
    mime_type: "image/png",
  },
};

describe("IterationLayer Node", () => {
  it("has correct node description", () => {
    const node = new IterationLayer();

    expect(node.description.name).toBe("iterationLayer");
    expect(node.description.displayName).toBe("Iteration Layer");
    expect(node.description.credentials?.at(0)?.name).toBe("iterationLayerApi");
  });

  it("has six resource options", () => {
    const node = new IterationLayer();
    const resourceProperty = node.description.properties.find((prop) => prop.name === "resource");

    expect(resourceProperty?.type).toBe("options");
    const options = resourceProperty?.options as Array<{ value: string }>;
    const resourceValues = options.map((option) => option.value);

    expect(resourceValues).toContain("documentExtraction");
    expect(resourceValues).toContain("imageTransformation");
    expect(resourceValues).toContain("imageGeneration");
    expect(resourceValues).toContain("documentGeneration");
    expect(resourceValues).toContain("documentToMarkdown");
    expect(resourceValues).toContain("sheetGeneration");
  });

  it("uses default base URL when credentials baseUrl is empty", async () => {
    const mockFunctions = createMockExecuteFunctions(
      {
        resource: "documentExtraction",
        isAsync: false,
        schemaInputMode: "uiBuilder",
        files: { fileValues: [] },
        schemaFields: { fieldValues: [] },
      },
      { success: true, data: {} },
      { baseUrl: "" },
    );

    const node = new IterationLayer();
    await node.execute.call(mockFunctions as never);

    expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
      "iterationLayerApi",
      expect.objectContaining({
        url: "https://api.iterationlayer.com/document-extraction/v1/extract",
      }),
    );
  });

  it("processes multiple input items", async () => {
    const mockFunctions = createMockExecuteFunctions(
      {
        resource: "documentExtraction",
        isAsync: false,
        schemaInputMode: "uiBuilder",
        files: { fileValues: [] },
        schemaFields: { fieldValues: [] },
      },
      { success: true, data: { field: { value: "test" } } },
    );
    mockFunctions.getInputData.mockReturnValue([{ json: {} }, { json: {} }, { json: {} }]);

    const node = new IterationLayer();
    const result = await node.execute.call(mockFunctions as never);

    expect(result.at(0)).toHaveLength(3);
    expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(3);
  });

  describe("Document Extraction", () => {
    it("sends correct request with UI builder schema", async () => {
      const apiResponse = {
        success: true,
        data: {
          invoice_number: {
            value: "INV-001",
            confidence: 0.98,
            citations: ["Invoice #INV-001"],
            source: "invoice.pdf",
            type: "TEXT",
          },
        },
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "uiBuilder",
          files: {
            fileValues: [
              {
                fileInputMode: "url",
                fileName: "invoice.pdf",
                fileUrl: "https://example.com/invoice.pdf",
              },
            ],
          },
          schemaFields: {
            fieldValues: [
              {
                name: "invoice_number",
                description: "The invoice number",
                type: "TEXT",
                isRequired: true,
              },
            ],
          },
        },
        apiResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
        "iterationLayerApi",
        expect.objectContaining({
          method: "POST",
          url: "https://api.iterationlayer.com/document-extraction/v1/extract",
        }),
      );

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.files).toEqual([
        { type: "url", name: "invoice.pdf", url: "https://example.com/invoice.pdf" },
      ]);
      expect(requestBody.schema).toEqual({
        fields: [
          {
            name: "invoice_number",
            description: "The invoice number",
            type: "TEXT",
            is_required: true,
          },
        ],
      });

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toEqual(apiResponse.data);
    });

    it("sends correct request with raw JSON schema", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "rawJson",
          files: { fileValues: [] },
          schemaJson: '{"fields": [{"name": "total", "type": "DECIMAL"}]}',
        },
        { success: true, data: {} },
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.schema).toEqual({
        fields: [{ name: "total", type: "DECIMAL" }],
      });
    });

    it("handles binary file input", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "uiBuilder",
          files: {
            fileValues: [
              {
                fileInputMode: "binaryData",
                fileBinaryPropertyName: "data",
                fileName: "scan.pdf",
              },
            ],
          },
          schemaFields: { fieldValues: [] },
        },
        { success: true, data: {} },
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.files.at(0).type).toBe("base64");
      expect(requestBody.files.at(0).name).toBe("scan.pdf");
      expect(requestBody.files.at(0).base64).toBe(Buffer.from("file content").toString("base64"));
    });
  });

  describe("Image Transformation", () => {
    it("sends correct request with URL input and returns binary output", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              {
                operationType: "resize",
                widthInPx: 800,
                heightInPx: 600,
                fit: "cover",
              },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
        "iterationLayerApi",
        expect.objectContaining({
          url: "https://api.iterationlayer.com/image-transformation/v1/transform",
        }),
      );

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toEqual({ mimeType: "image/png" });
      expect(firstItem?.binary).toBeDefined();
    });

    it("handles binary file input", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "binaryData",
          fileBinaryPropertyName: "data",
          fileName: "photo.jpg",
          operations: { operationValues: [{ operationType: "grayscale" }] },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      expect(mockFunctions.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(0, "data");
      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.file.type).toBe("base64");
    });

    it("builds multiple operations in sequence", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              {
                operationType: "resize",
                widthInPx: 800,
                heightInPx: 600,
                fit: "cover",
              },
              { operationType: "blur", sigma: 5 },
              {
                operationType: "convert",
                convertFormat: "webp",
                quality: 80,
              },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations).toEqual([
        { type: "resize", width_in_px: 800, height_in_px: 600, fit: "cover" },
        { type: "blur", sigma: 5 },
        { type: "convert", format: "webp", quality: 80 },
      ]);
    });

    it("builds crop operation correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              {
                operationType: "crop",
                leftInPx: 10,
                topInPx: 20,
                widthInPx: 300,
                heightInPx: 200,
              },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations.at(0)).toEqual({
        type: "crop",
        left_in_px: 10,
        top_in_px: 20,
        width_in_px: 300,
        height_in_px: 200,
      });
    });

    it("builds extend operation correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              {
                operationType: "extend",
                extendTopInPx: 10,
                extendBottomInPx: 10,
                extendLeftInPx: 20,
                extendRightInPx: 20,
                hexColor: "#FF0000",
              },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations.at(0)).toEqual({
        type: "extend",
        top_in_px: 10,
        bottom_in_px: 10,
        left_in_px: 20,
        right_in_px: 20,
        hex_color: "#FF0000",
      });
    });

    it("builds parameterless operations correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              { operationType: "flip" },
              { operationType: "flop" },
              { operationType: "grayscale" },
              { operationType: "invert_colors" },
              { operationType: "auto_contrast" },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations).toEqual([
        { type: "flip" },
        { type: "flop" },
        { type: "grayscale" },
        { type: "invert_colors" },
        { type: "auto_contrast" },
      ]);
    });

    it("builds modulate operation correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [
              {
                operationType: "modulate",
                brightness: 1.2,
                saturation: 0.8,
                hue: 45,
              },
            ],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations.at(0)).toEqual({
        type: "modulate",
        brightness: 1.2,
        saturation: 0.8,
        hue: 45,
      });
    });

    it("builds upscale operation correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [{ operationType: "upscale", upscaleFactor: 3 }],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations.at(0)).toEqual({ type: "upscale", factor: 3 });
    });

    it("builds compress_to_size operation correctly", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: {
            operationValues: [{ operationType: "compress_to_size", maxFileSizeInBytes: 250_000 }],
          },
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.operations.at(0)).toEqual({
        type: "compress_to_size",
        max_file_size_in_bytes: 250_000,
      });
    });
  });

  describe("Image Generation", () => {
    it("sends correct request with parsed JSON layers", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageGeneration",
          isAsync: false,
          widthInPx: 1200,
          heightInPx: 630,
          outputFormat: "png",
          layersJson: '[{"type": "solid-color", "index": 0, "hex_color": "#FFFFFF"}]',
          fontsJson: "[]",
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.dimensions).toEqual({ width: 1200, height: 630 });
      expect(requestBody.layers).toEqual([{ type: "solid-color", index: 0, hex_color: "#FFFFFF" }]);
      expect(requestBody.output_format).toBe("png");

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.binary).toBeDefined();
    });

    it("includes fonts when non-empty", async () => {
      const fontsArray = [
        {
          name: "Custom",
          weight: "regular",
          style: "normal",
          file: { type: "url", name: "font.ttf", url: "https://example.com/font.ttf" },
        },
      ];

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageGeneration",
          isAsync: false,
          widthInPx: 800,
          heightInPx: 600,
          outputFormat: "png",
          layersJson: "[]",
          fontsJson: JSON.stringify(fontsArray),
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.fonts).toEqual(fontsArray);
    });

    it("excludes fonts when empty array", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageGeneration",
          isAsync: false,
          widthInPx: 800,
          heightInPx: 600,
          outputFormat: "png",
          layersJson: "[]",
          fontsJson: "[]",
        },
        BINARY_API_RESPONSE,
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.fonts).toBeUndefined();
    });
  });

  describe("Document Generation", () => {
    it("sends correct request with parsed JSON document", async () => {
      const apiResponse = {
        success: true,
        data: {
          buffer: Buffer.from("pdf content").toString("base64"),
          mime_type: "application/pdf",
        },
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentGeneration",
          isAsync: false,
          format: "pdf",
          documentJson: '{"metadata": {"title": "Test"}, "content": []}',
        },
        apiResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.format).toBe("pdf");
      expect(requestBody.document).toEqual({
        metadata: { title: "Test" },
        content: [],
      });

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.binary).toBeDefined();
    });

    it("supports docx format", async () => {
      const apiResponse = {
        success: true,
        data: {
          buffer: Buffer.from("docx content").toString("base64"),
          mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentGeneration",
          isAsync: false,
          format: "docx",
          documentJson: '{"metadata": {"title": "Test"}, "content": []}',
        },
        apiResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.format).toBe("docx");

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });
  });

  describe("Document to Markdown", () => {
    it("sends correct request and returns JSON output", async () => {
      const apiResponse = {
        success: true,
        data: {
          name: "report.pdf",
          mime_type: "application/pdf",
          markdown: "## Quarterly Report\n\nRevenue grew 12%...",
        },
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentToMarkdown",
          fileInputMode: "url",
          fileName: "report.pdf",
          fileUrl: "https://example.com/reports/report.pdf",
        },
        apiResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
        "iterationLayerApi",
        expect.objectContaining({
          url: "https://api.iterationlayer.com/document-to-markdown/v1/convert",
        }),
      );

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toEqual(apiResponse.data);
      expect(firstItem?.binary).toBeUndefined();
    });
  });

  describe("Sheet Generation", () => {
    it("sends correct request and returns binary output", async () => {
      const apiResponse = {
        success: true,
        data: {
          buffer: Buffer.from("xlsx content").toString("base64"),
          mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "sheetGeneration",
          isAsync: false,
          sheetFormat: "xlsx",
          sheetsJson: '[{"name": "Sheet 1", "columns": [{"name": "Name"}], "rows": [["Test"]]}]',
          sheetStylesJson: "{}",
        },
        apiResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.format).toBe("xlsx");
      expect(requestBody.sheets).toEqual([
        { name: "Sheet 1", columns: [{ name: "Name" }], rows: [["Test"]] },
      ]);

      expect(mockFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
        "iterationLayerApi",
        expect.objectContaining({
          url: "https://api.iterationlayer.com/sheet-generation/v1/generate",
        }),
      );

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.binary).toBeDefined();
    });
  });

  describe("Async mode", () => {
    it("includes webhook_url for document extraction", async () => {
      const asyncResponse = {
        success: true,
        async: true,
        message: "Request accepted. Results will be delivered to the provided webhook URL.",
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: true,
          webhookUrl: "https://my-app.com/webhook",
          schemaInputMode: "uiBuilder",
          files: { fileValues: [] },
          schemaFields: { fieldValues: [] },
        },
        asyncResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.webhook_url).toBe("https://my-app.com/webhook");

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toEqual({
        async: true,
        message: asyncResponse.message,
      });
    });

    it("includes webhook_url for image transformation", async () => {
      const asyncResponse = {
        success: true,
        async: true,
        message: "Request accepted.",
      };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: true,
          webhookUrl: "https://my-app.com/webhook",
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: { operationValues: [] },
        },
        asyncResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toEqual({ async: true, message: "Request accepted." });
      expect(firstItem?.binary).toBeUndefined();
    });

    it("includes webhook_url for image generation", async () => {
      const asyncResponse = { success: true, async: true, message: "Accepted." };

      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageGeneration",
          isAsync: true,
          webhookUrl: "https://my-app.com/webhook",
          widthInPx: 800,
          heightInPx: 600,
          outputFormat: "png",
          layersJson: "[]",
          fontsJson: "[]",
        },
        asyncResponse,
      );

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.webhook_url).toBe("https://my-app.com/webhook");

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.binary).toBeUndefined();
    });

    it("does not include webhook_url when async is disabled", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "uiBuilder",
          files: { fileValues: [] },
          schemaFields: { fieldValues: [] },
        },
        { success: true, data: {} },
      );

      const node = new IterationLayer();
      await node.execute.call(mockFunctions as never);

      const requestBody = mockFunctions.helpers.httpRequestWithAuthentication.mock.calls
        .at(0)
        ?.at(1)?.body;
      expect(requestBody.webhook_url).toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("throws NodeOperationError on API error", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "uiBuilder",
          files: { fileValues: [] },
          schemaFields: { fieldValues: [] },
        },
        { success: false, error: "Invalid API key" },
      );

      const node = new IterationLayer();

      await expect(node.execute.call(mockFunctions as never)).rejects.toThrow(
        "API error: Invalid API key",
      );
    });

    it("continues on fail when configured", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "documentExtraction",
          isAsync: false,
          schemaInputMode: "uiBuilder",
          files: { fileValues: [] },
          schemaFields: { fieldValues: [] },
        },
        { success: false, error: "Rate limit exceeded" },
      );
      mockFunctions.continueOnFail.mockReturnValue(true);

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json).toHaveProperty("error");
    });

    it("includes error message in continueOnFail output", async () => {
      const mockFunctions = createMockExecuteFunctions(
        {
          resource: "imageTransformation",
          isAsync: false,
          fileInputMode: "url",
          fileName: "photo.jpg",
          fileUrl: "https://example.com/photo.jpg",
          operations: { operationValues: [] },
        },
        { success: false, error: "Insufficient credits" },
      );
      mockFunctions.continueOnFail.mockReturnValue(true);

      const node = new IterationLayer();
      const result = await node.execute.call(mockFunctions as never);

      const [firstItem] = result.at(0) ?? [];
      expect(firstItem?.json.error).toContain("Insufficient credits");
    });
  });
});
