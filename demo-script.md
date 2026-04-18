# n8n Demo Recording Script

Playwright automation spec for recording a demo video of the Iteration Layer
n8n community node. Uses exact selectors discovered during manual walkthrough.

## Prerequisites

- Phoenix dev server on `0.0.0.0:4000` with direnv (`mix phx.server`)
- n8n in Docker via `docker compose --profile n8n up -d`
- Docker compose: `extra_hosts: ["api.localhost:host-gateway"]` on n8n service
- Playwright MCP config with video recording (1280x720)
- `n8n-nodes-iterationlayer` installed in n8n
- API key in local Phoenix DB (created via `ApiKeys.generate_api_key/1`)

## Playwright Commands

### 1. Navigate to n8n

```js
await page.goto('http://localhost:5678');
```

### 2. Install Community Node (skip if already installed)

```js
await page.goto('http://localhost:5678/settings/community-nodes');
await page.getByRole('button', { name: 'Install' }).click();
await page.locator('[data-test-id="communityPackageInstall-packageName"]').fill('n8n-nodes-iterationlayer');
await page.locator('[data-test-id="communityPackageInstall-checkboxAccept"]').click();
await page.locator('[data-test-id="communityPackageInstall-installButton"]').click();
await page.waitForSelector('text=n8n-nodes-iterationlayer');
```

### 3. Create Credential

```js
await page.goto('http://localhost:5678/home/credentials');
await page.getByRole('button', { name: /Add first credential|Create credential/ }).click();

await page.getByRole('combobox', { name: 'Search for app...' }).fill('Iteration Layer');
await page.getByRole('option', { name: 'Iteration Layer API' }).click();
await page.locator('[data-test-id="new-credential-type-button"]').click();

await page.locator('[data-test-id="parameter-input-apiKey"] [data-test-id="parameter-input-field"]').fill('API_KEY_HERE');

await page.locator('[data-test-id="parameter-input-baseUrl"] [data-test-id="parameter-input-field"]').click();
await page.keyboard.press('Control+a');
await page.locator('[data-test-id="parameter-input-baseUrl"] [data-test-id="parameter-input-field"]').fill('http://api.localhost:4000');

await page.getByRole('button', { name: 'Save' }).click();
await new Promise(f => setTimeout(f, 3000));
await page.getByRole('button', { name: 'Close this dialog' }).click();
```

### 4. Create Workflow with Manual Trigger

```js
await page.goto('http://localhost:5678/workflow/new');
await page.getByRole('group').click();
await page.locator('[data-test-id="node-creator-node-item"]').first().click();
```

### 5. Add Iteration Layer Node

```js
await page.locator('[data-test-id="node-creator-plus-button"]').click();
await page.locator('[data-test-id="node-creator-search-bar"]').fill('Iteration Layer');
await page.locator('[data-test-id="node-creator-node-item"]').click();
await page.getByRole('button', { name: 'Add to workflow' }).click();
```

### 6. Test Document Extraction

```js
// Add File
await page.locator('[data-test-id="fixed-collection-files"] [data-test-id="fixed-collection-add-top-level-button"]').click();

// Change file input mode to URL
await page.locator('[data-test-id="parameter-input-fileInputMode"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'URL' }).click();

// File URL and name
await page.locator('[data-test-id="parameter-input-fileUrl"] [data-test-id="parameter-input-field"]').fill('https://pdfobject.com/pdf/sample.pdf');
await page.locator('[data-test-id="parameter-input-fileName"] [data-test-id="parameter-input-field"]').fill('sample.pdf');

// Add schema field
await page.locator('[data-test-id="fixed-collection-schemaFields"] [data-test-id="fixed-collection-add-top-level-button"]').click();
await page.locator('[data-test-id="parameter-input-name"] [data-test-id="parameter-input-field"]').fill('title');
await page.locator('[data-test-id="parameter-input-description"] [data-test-id="parameter-input-field"]').fill('The title of the document');

// Execute
await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 30000));
// Output: title.value = "Sample PDF", title.confidence = 1.0
```

### 7. Test Document to Markdown

```js
await page.locator('[data-test-id="parameter-input-resource"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'Document to Markdown Convert' }).click();

await page.locator('[data-test-id="parameter-input-fileInputMode"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'URL' }).click();

await page.locator('[data-test-id="parameter-input-fileUrl"] [data-test-id="parameter-input-field"]').fill('https://pdfobject.com/pdf/sample.pdf');
await page.locator('[data-test-id="parameter-input-fileName"] [data-test-id="parameter-input-field"]').fill('sample.pdf');

await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 15000));
// Output: name = "sample.pdf", markdown = "Sample PDF\n...", mime_type = "application/pdf"
```

### 8. Test Image Transformation

```js
await page.locator('[data-test-id="parameter-input-resource"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'Image Transformation Resize,' }).click();

await page.locator('[data-test-id="parameter-input-fileUrl"] [data-test-id="parameter-input-field"]').fill('https://picsum.photos/id/237/800/600');
await page.locator('[data-test-id="parameter-input-fileName"] [data-test-id="parameter-input-field"]').fill('photo.jpg');

// Add resize operation (auto-added with defaults: 800x600, cover)
await page.locator('[data-test-id="fixed-collection-add-top-level-button"]').click();

await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 10000));
// Output: Binary - transformed.jpg, image/jpeg
```

### 9. Test Image Generation

```js
await page.locator('[data-test-id="parameter-input-resource"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'Image Generation Generate' }).click();

// Defaults: 1200x630 PNG, white background + "Hello World" text
await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 10000));
// Output: Binary - generated.png, image/png
```

### 10. Test Document Generation

```js
await page.locator('[data-test-id="parameter-input-resource"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'Document Generation Generate' }).click();

// Defaults: PDF format, sample document with "Hello World" headline
await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 10000));
// Output: Binary - document.pdf, application/pdf
```

### 11. Test Sheet Generation

```js
await page.locator('[data-test-id="parameter-input-resource"]').getByRole('combobox', { name: 'Select' }).click();
await page.getByRole('option', { name: 'Sheet Generation Generate' }).click();

// Defaults: XLSX format, 2 columns (Name, Amount), 2 rows
await page.locator('[data-test-id="node-execute-button"]').click();
await new Promise(f => setTimeout(f, 10000));
// Output: Binary - spreadsheet.bin, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### 12. Close Browser and Convert Video

```js
await page.close();
```

```bash
VIDEO=$(ls -t /tmp/playwright-videos/*.webm | head -1)
ffmpeg -i "$VIDEO" -c:v libx264 -preset fast -crf 23 integrations/n8n/demo.mp4
```

## Selector Reference

| Element | Selector |
|---------|----------|
| Resource dropdown | `[data-test-id="parameter-input-resource"] combobox` |
| File Input Mode dropdown | `[data-test-id="parameter-input-fileInputMode"] combobox` |
| File URL input | `[data-test-id="parameter-input-fileUrl"] [data-test-id="parameter-input-field"]` |
| File Name input | `[data-test-id="parameter-input-fileName"] [data-test-id="parameter-input-field"]` |
| API Key input | `[data-test-id="parameter-input-apiKey"] [data-test-id="parameter-input-field"]` |
| Base URL input | `[data-test-id="parameter-input-baseUrl"] [data-test-id="parameter-input-field"]` |
| Execute step button | `[data-test-id="node-execute-button"]` |
| Add File button (extraction) | `[data-test-id="fixed-collection-files"] [data-test-id="fixed-collection-add-top-level-button"]` |
| Add Field button (schema) | `[data-test-id="fixed-collection-schemaFields"] [data-test-id="fixed-collection-add-top-level-button"]` |
| Add Operation button (transform) | `[data-test-id="fixed-collection-add-top-level-button"]` |
| Node search bar | `[data-test-id="node-creator-search-bar"]` |
| Node search result | `[data-test-id="node-creator-node-item"]` |
| Nodes panel button | `[data-test-id="node-creator-plus-button"]` |
| Credential type button | `[data-test-id="new-credential-type-button"]` |
| Credential select | `combobox[name="Select Credential"]` |
