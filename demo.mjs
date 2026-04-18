import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const API_KEY = process.env.IL_API_KEY;
const BASE_URL = process.env.IL_BASE_URL || "http://api.localhost:4000";
const VIDEO_DIR = join(__dirname, "demo-videos");
const OUTPUT_PATH = join(__dirname, "demo.webm");

if (!API_KEY) {
  console.error("IL_API_KEY environment variable is required");
  process.exit(1);
}

mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
});

const page = await context.newPage();

async function waitForExecution(timeoutInMs = 30_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutInMs) {
    const title = await page.title();

    if (title.includes("▶️") || title.includes("⚠️")) {
      return;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Execution did not complete within ${timeoutInMs}ms`);
}

async function selectResource(optionText) {
  await page
    .locator('[data-test-id="parameter-input-resource"]')
    .getByRole("combobox", { name: "Select" })
    .click();
  await page.getByRole("option", { name: optionText }).click();
}

async function fillFileUrl(url, fileName) {
  await page
    .locator(
      '[data-test-id="parameter-input-fileUrl"] [data-test-id="parameter-input-field"]',
    )
    .fill(url);
  await page
    .locator(
      '[data-test-id="parameter-input-fileName"] [data-test-id="parameter-input-field"]',
    )
    .fill(fileName);
}

async function executeStep() {
  await page.locator('[data-test-id="node-execute-button"]').click();
}

async function expectSuccess() {
  await waitForExecution();
  const title = await page.title();

  if (title.includes("⚠️")) {
    throw new Error("Execution failed (⚠️ in title)");
  }
}

try {
  console.log("1. Navigating to n8n...");
  await page.goto(N8N_URL);
  await page.waitForTimeout(2000);

  const isSetup = await page
    .getByRole("button", { name: "Next" })
    .isVisible()
    .catch(() => false);

  if (isSetup) {
    console.log("   Fresh install detected, creating account...");
    await page.getByLabel("Email").fill("demo@iterationlayer.com");
    await page.getByLabel("First name").fill("Demo");
    await page.getByLabel("Last name").fill("User");
    await page.getByLabel("Password").fill("DemoPassword123!");
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(2000);

    const otherButton = page.getByText("Other");
    if (await otherButton.isVisible().catch(() => false)) {
      await otherButton.click();
      await page.waitForTimeout(500);
    }

    const getStartedButton = page.getByRole("button", {
      name: "Get started",
    });
    if (await getStartedButton.isVisible().catch(() => false)) {
      await getStartedButton.click();
      await page.waitForTimeout(2000);
    }

    const skipButton = page.getByRole("button", { name: "Skip" });
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await page.waitForTimeout(1000);
    }
  }

  console.log("2. Installing community node...");
  await page.goto(`${N8N_URL}/settings/community-nodes`);
  await page.waitForTimeout(2000);

  const alreadyInstalled = await page
    .getByText("n8n-nodes-iterationlayer")
    .isVisible()
    .catch(() => false);

  if (!alreadyInstalled) {
    await page.getByRole("button", { name: "Install" }).click();
    await page
      .locator('[data-test-id="communityPackageInstall-packageName"]')
      .fill("n8n-nodes-iterationlayer");
    await page
      .locator('[data-test-id="communityPackageInstall-checkboxAccept"]')
      .click();
    await page
      .locator('[data-test-id="communityPackageInstall-installButton"]')
      .click();
    await page.waitForSelector("text=n8n-nodes-iterationlayer", {
      timeout: 60_000,
    });
  }

  console.log("3. Creating credential...");
  await page.goto(`${N8N_URL}/home/credentials`);
  await page.waitForTimeout(2000);

  const hasCredential = await page
    .getByText("Iteration Layer")
    .isVisible()
    .catch(() => false);

  if (!hasCredential) {
    await page
      .getByRole("button", { name: /Add first credential|Create credential/ })
      .click();
    await page
      .getByRole("combobox", { name: "Search for app..." })
      .fill("Iteration Layer");
    await page.getByRole("option", { name: "Iteration Layer API" }).click();
    await page
      .locator('[data-test-id="new-credential-type-button"]')
      .click();

    await page
      .locator(
        '[data-test-id="parameter-input-apiKey"] [data-test-id="parameter-input-field"]',
      )
      .fill(API_KEY);

    const baseUrlField = page.locator(
      '[data-test-id="parameter-input-baseUrl"] [data-test-id="parameter-input-field"]',
    );
    await baseUrlField.click();
    await page.keyboard.press("Control+a");
    await baseUrlField.fill(BASE_URL);

    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(3000);
  }

  await page
    .getByRole("button", { name: "Close this dialog" })
    .click()
    .catch(() => {});

  console.log("4. Creating workflow...");
  await page.goto(`${N8N_URL}/workflow/new`);
  await page.waitForTimeout(1000);
  await page.getByRole("group").click();
  await page
    .locator('[data-test-id="node-creator-node-item"]')
    .first()
    .click();

  console.log("5. Adding Iteration Layer node...");
  await page
    .locator('[data-test-id="node-creator-plus-button"]')
    .click();
  await page
    .locator('[data-test-id="node-creator-search-bar"]')
    .fill("Iteration Layer");
  await page.locator('[data-test-id="node-creator-node-item"]').click();
  await page.getByRole("button", { name: "Add to workflow" }).click();
  await page.waitForTimeout(500);

  // --- Test Document Extraction ---
  console.log("6. Testing Document Extraction...");
  await page
    .locator(
      '[data-test-id="fixed-collection-files"] [data-test-id="fixed-collection-add-top-level-button"]',
    )
    .click();

  await page
    .locator('[data-test-id="parameter-input-fileInputMode"]')
    .getByRole("combobox", { name: "Select" })
    .click();
  await page.getByRole("option", { name: "URL" }).click();

  await fillFileUrl("https://pdfobject.com/pdf/sample.pdf", "sample.pdf");

  await page
    .locator(
      '[data-test-id="fixed-collection-schemaFields"] [data-test-id="fixed-collection-add-top-level-button"]',
    )
    .click();
  await page
    .locator(
      '[data-test-id="parameter-input-name"] [data-test-id="parameter-input-field"]',
    )
    .fill("title");
  await page
    .locator(
      '[data-test-id="parameter-input-description"] [data-test-id="parameter-input-field"]',
    )
    .fill("The title of the document");

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Document Extraction passed");

  // --- Test Document to Markdown ---
  console.log("7. Testing Document to Markdown...");
  await selectResource("Document to Markdown Convert");

  await page
    .locator('[data-test-id="parameter-input-fileInputMode"]')
    .getByRole("combobox", { name: "Select" })
    .click();
  await page.getByRole("option", { name: "URL" }).click();

  await fillFileUrl("https://pdfobject.com/pdf/sample.pdf", "sample.pdf");

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Document to Markdown passed");

  // --- Test Image Transformation ---
  console.log("8. Testing Image Transformation...");
  await selectResource("Image Transformation Resize,");

  await fillFileUrl("https://picsum.photos/id/237/800/600", "photo.jpg");

  await page
    .locator('[data-test-id="fixed-collection-add-top-level-button"]')
    .click();

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Image Transformation passed");

  // --- Test Image Generation ---
  console.log("9. Testing Image Generation...");
  await selectResource("Image Generation Generate");

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Image Generation passed");

  // --- Test Document Generation ---
  console.log("10. Testing Document Generation...");
  await selectResource("Document Generation Generate");

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Document Generation passed");

  // --- Test Sheet Generation ---
  console.log("11. Testing Sheet Generation...");
  await selectResource("Sheet Generation Generate");

  await executeStep();
  await expectSuccess();
  console.log("   ✓ Sheet Generation passed");

  console.log("\nAll tests passed!");
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await page.close();
  await context.close();

  const videoPath = await page.video()?.path();

  if (videoPath && existsSync(videoPath)) {
    const { copyFileSync } = await import("node:fs");
    copyFileSync(videoPath, OUTPUT_PATH);
    console.log(`Video saved to: ${OUTPUT_PATH}`);
  }

  await browser.close();
}
