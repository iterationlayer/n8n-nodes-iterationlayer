import { chromium } from "playwright";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const N8N_DIR = join(__dirname, "..");

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const AUTH_COOKIE = process.env.N8N_AUTH_COOKIE;
const OUTPUT_DIR = process.env.DEMO_OUTPUT_DIR || N8N_DIR;
const VIDEO_DIR = join(OUTPUT_DIR, "demo-videos");
const OUTPUT_PATH = join(OUTPUT_DIR, "demo.webm");
const PAUSE_IN_MS = 800;
const RESULT_PAUSE_IN_MS = 4_000;

if (!AUTH_COOKIE) {
  console.error("N8N_AUTH_COOKIE environment variable is required");
  process.exit(1);
}

mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});

const authCookieEntry = {
  name: AUTH_COOKIE.split("=").at(0),
  value: AUTH_COOKIE.split("=").slice(1).join("="),
  domain: new URL(N8N_URL).hostname,
  path: "/",
};

// Dismiss onboarding in an unrecorded context
const setupContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await setupContext.addCookies([authCookieEntry]);
const setupPage = await setupContext.newPage();
await setupPage.goto(`${N8N_URL}/home/workflows`);
await setupPage.waitForTimeout(2_000);

for (const buttonName of ["Skip", "Get started", "Close", "Dismiss", "Not now"]) {
  const button = setupPage.getByRole("button", { name: buttonName });

  if (await button.isVisible({ timeout: 300 }).catch(() => false)) {
    await button.click();
    await setupPage.waitForTimeout(300);
  }
}

await setupPage.keyboard.press("Escape");
await setupPage.waitForTimeout(300);
await setupPage.close();
await setupContext.close();

// Start recorded context
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
});

await context.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = "* { cursor: none !important; }";
  document.head.appendChild(style);
});

await context.addCookies([authCookieEntry]);
const page = await context.newPage();

// Helpers

async function pause() {
  await page.waitForTimeout(PAUSE_IN_MS);
}

async function showResult() {
  await page.waitForTimeout(RESULT_PAUSE_IN_MS);
}

async function waitForExecution(timeoutInMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutInMs) {
    const title = await page.title();

    if (title.includes("🔄")) {
      break;
    }

    if (title.includes("⚠️") || title.includes("▶️")) {
      return;
    }

    await page.waitForTimeout(200);
  }

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
  await pause();
  await page
    .locator('[data-test-id="parameter-input-resource"]')
    .getByRole("combobox", { name: "Select" })
    .click();
  await pause();
  await page.getByRole("option", { name: optionText }).click();
  await pause();
}

async function executeAndExpectSuccess() {
  await pause();
  await page.locator('[data-test-id="node-execute-button"]').click();
  await waitForExecution();
  const title = await page.title();

  if (title.includes("⚠️")) {
    throw new Error("Execution failed (⚠️ in title)");
  }

  await showResult();
}

async function fillInput(parameterName, value) {
  await page
    .locator(
      `[data-test-id="parameter-input-${parameterName}"] [data-test-id="parameter-input-field"]`,
    )
    .fill(value);
  await pause();
}

async function selectOption(parameterName, optionText) {
  await page
    .locator(`[data-test-id="parameter-input-${parameterName}"]`)
    .getByRole("combobox", { name: "Select" })
    .click();
  await pause();
  await page.getByRole("option", { name: optionText }).click();
  await pause();
}

// Test flow

try {
  console.log("Creating workflow...");
  await page.goto(`${N8N_URL}/workflow/new`);
  await page.waitForTimeout(2_000);
  await page.keyboard.press("Escape");
  await pause();

  await page.getByRole("group").click();
  await pause();
  await page
    .locator('[data-test-id="node-creator-node-item"]')
    .first()
    .click();
  await pause();

  console.log("Adding Iteration Layer node...");
  await page
    .locator('[data-test-id="node-creator-plus-button"]')
    .click();
  await pause();
  await page
    .locator('[data-test-id="node-creator-search-bar"]')
    .fill("Iteration Layer");
  await pause();
  await page.locator('[data-test-id="node-creator-node-item"]').click();
  await pause();
  await page.getByRole("button", { name: "Add to workflow" }).click();
  await page.waitForTimeout(1_000);
  await page
    .locator('[data-test-id="node-execute-button"]')
    .waitFor({ timeout: 5_000 });
  await pause();

  // Document Extraction
  console.log("Testing Document Extraction...");
  await page.getByRole("button", { name: "Add File" }).first().click();
  await pause();
  await selectOption("fileInputMode", "URL");
  await fillInput("fileUrl", "https://pdfobject.com/pdf/sample.pdf");
  await fillInput("fileName", "sample.pdf");

  await page.getByRole("button", { name: "Add Field" }).first().click();
  await pause();
  await fillInput("name", "title");
  await fillInput("description", "The title of the document");

  await executeAndExpectSuccess();
  console.log("  ✓ Document Extraction passed");

  // Document to Markdown
  console.log("Testing Document to Markdown...");
  await selectResource("Document to Markdown Convert");
  await selectOption("fileInputMode", "URL");
  await fillInput("fileUrl", "https://pdfobject.com/pdf/sample.pdf");
  await fillInput("fileName", "sample.pdf");

  await executeAndExpectSuccess();
  console.log("  ✓ Document to Markdown passed");

  // Image Transformation
  console.log("Testing Image Transformation...");
  await selectResource("Image Transformation Resize,");
  await fillInput("fileUrl", "https://picsum.photos/id/237/800/600");
  await fillInput("fileName", "photo.jpg");
  await page
    .getByRole("button", { name: "Add Operation" })
    .first()
    .click();
  await pause();

  await executeAndExpectSuccess();
  console.log("  ✓ Image Transformation passed");

  // Image Generation
  console.log("Testing Image Generation...");
  await selectResource("Image Generation Generate");

  await executeAndExpectSuccess();
  console.log("  ✓ Image Generation passed");

  // Document Generation
  console.log("Testing Document Generation...");
  await selectResource("Document Generation Generate");

  await executeAndExpectSuccess();
  console.log("  ✓ Document Generation passed");

  // Sheet Generation
  console.log("Testing Sheet Generation...");
  await selectResource("Sheet Generation Generate");

  await executeAndExpectSuccess();
  console.log("  ✓ Sheet Generation passed");

  console.log("\nAll tests passed!");
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  await page.screenshot({ path: join(OUTPUT_DIR, "debug-failure.png") });
  process.exitCode = 1;
} finally {
  await page.close();
  await context.close();

  const videoPath = await page.video()?.path();

  if (videoPath && existsSync(videoPath)) {
    copyFileSync(videoPath, OUTPUT_PATH);
    console.log(`Video saved to: ${OUTPUT_PATH}`);
  }

  await browser.close();
}
