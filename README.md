# n8n-nodes-iterationlayer

n8n community node for the [Iteration Layer](https://iterationlayer.com) API.

Extract data from documents, transform images, generate images, and create documents — all from your n8n workflows.

## Demo

<video src="https://github.com/iterationlayer/n8n-nodes-iterationlayer/raw/main/demo.mp4" width="100%" autoplay loop muted></video>

## Installation

### Via n8n UI (recommended)

1. Open **Settings** > **Community Nodes**
2. Select **Install a community node**
3. Enter `n8n-nodes-iterationlayer`
4. Accept the risks and install

### Via npm (self-hosted)

```bash
cd ~/.n8n
npm install n8n-nodes-iterationlayer
```

Restart n8n after installation.

## Credentials

1. Go to **Credentials** > **New Credential**
2. Search for **Iteration Layer API**
3. Enter your API key (starts with `il_`)
4. Get an API key at [platform.iterationlayer.com](https://platform.iterationlayer.com)

## Resources

The node provides one resource per Iteration Layer API:

### Document Extraction

Extract structured data from PDFs, images, DOCX, and more. Define a schema with field names, types, and descriptions — the API returns typed values with confidence scores.

- **File input**: Binary data from a previous node or a public URL
- **Schema**: Build via the UI (17 field types) or provide raw JSON for advanced schemas (arrays, calculated fields)

### Image Transformation

Apply image operations sequentially: resize, crop, rotate, blur, sharpen, convert format, upscale, remove background, and more (24 operations total).

- **File input**: Binary data or URL
- **Operations**: Add multiple operations via the UI — each type shows its specific parameters

### Image Generation

Generate images from layer compositions defined as JSON. Supports solid-color, text, image, QR code, barcode, and gradient layers.

- **Dimensions**: Width and height in pixels
- **Layers**: JSON array defining the composition (see [API docs](https://iterationlayer.com/docs/image-generation))
- **Output format**: PNG, JPEG, WebP, TIFF, GIF, or AVIF

### Document Generation

Generate PDF, DOCX, EPUB, or PPTX documents from structured JSON definitions including metadata, page layout, styles, and content blocks.

- **Format**: PDF, DOCX, EPUB, or PPTX
- **Document**: JSON object with the full document definition (see [API docs](https://iterationlayer.com/docs/document-generation))

### Document to Markdown

Convert PDFs, DOCX, PPTX, and other documents into clean, structured Markdown.

- **File input**: Binary data or URL
- **Output**: Markdown text with the document's content

### Sheet Generation

Generate XLSX, CSV, or Markdown spreadsheets from structured JSON definitions.

- **Sheets**: JSON array defining sheet names, columns, and row data
- **Styles**: Optional header and body cell styles
- **Output format**: XLSX, CSV, or Markdown

## Binary Data

Image Transformation, Image Generation, Document Generation, and Sheet Generation return binary data. The output is available as n8n binary data that you can pass to downstream nodes (e.g., write to disk, send via email, upload to S3).

Document Extraction returns JSON data with extracted field values and confidence scores. Document to Markdown returns JSON with the markdown text.

## Async Mode

All resources support async mode. Enable it and provide a webhook URL — the API returns immediately and delivers results to your webhook when processing is complete.

## Links

- [Iteration Layer Docs](https://iterationlayer.com/docs)
- [n8n Integration Guide](https://iterationlayer.com/docs/n8n)
- [API Reference](https://iterationlayer.com/docs/document-extraction)
- [Get an API Key](https://platform.iterationlayer.com)

## Issues & Feedback

Please report bugs and request features in the [issues repository](https://github.com/iterationlayer/issues).

## License

MIT
