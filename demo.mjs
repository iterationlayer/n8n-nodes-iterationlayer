import { chromium } from "playwright";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
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

// --- Setup via n8n REST API ---

let authCookie = null;

async function n8nApi(method, path, body) {
  const options = {
    method,
    headers: { "content-type": "application/json" },
  };

  if (authCookie) {
    options.headers.cookie = authCookie;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${N8N_URL}${path}`, options);
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const maybeAuth = setCookie.find((cookie) =>
    cookie.startsWith("n8n-auth="),
  );

  if (maybeAuth) {
    authCookie = maybeAuth.split(";").at(0);
  }

  return response.json();
}

console.log("1. Setting up n8n via REST API...");

await n8nApi("POST", "/rest/owner/setup", {
  email: "demo@iterationlayer.com",
  password: "DemoPassword123!",
  firstName: "Demo",
  lastName: "User",
});

if (!authCookie) {
  await n8nApi("POST", "/rest/login", {
    emailOrLdapLoginId: "demo@iterationlayer.com",
    password: "DemoPassword123!",
  });
}

if (!authCookie) {
  throw new Error("Could not authenticate with n8n");
}

console.log("   Account ready");

console.log("2. Installing community node...");
await n8nApi("POST", "/rest/community-packages", {
  name: "n8n-nodes-iterationlayer",
});
console.log("   Node installed");

console.log("3. Creating credential...");
const credentialResult = await n8nApi("POST", "/rest/credentials", {
  name: "Iteration Layer account",
  type: "iterationLayerApi",
  data: { apiKey: API_KEY, baseUrl: BASE_URL },
});
console.log(
  `   Credential created (id: ${credentialResult.data?.id ?? credentialResult.id})`,
);

// --- Browser automation ---

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
});

const page = await context.newPage();

// Inject auth cookie
const cookieParts = authCookie.split("=");
await context.addCookies([
  {
    name: cookieParts.at(0),
    value: cookieParts.slice(1).join("="),
    domain: new URL(N8N_URL).hostname,
    path: "/",
  },
]);

// --- Helpers ---

async function waitForExecution(timeoutInMs = 60_000) {
  const startedAt = Date.now();

  // First wait for execution to start (🔄 in title)
  while (Date.now() - startedAt < timeoutInMs) {
    const title = await page.title();

    if (title.includes("🔄")) {
      break;
    }

    if (title.includes("⚠️") || title.includes("▶️")) {
      // Already finished (very fast execution)
      return;
    }

    await page.waitForTimeout(200);
  }

  // Then wait for execution to complete
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

async function executeAndExpectSuccess() {
  await page.locator('[data-test-id="node-execute-button"]').click();
  await waitForExecution();
  const title = await page.title();

  if (title.includes("⚠️")) {
    throw new Error("Execution failed (⚠️ in title)");
  }
}

async function fillInput(parameterName, value) {
  await page
    .locator(
      `[data-test-id="parameter-input-${parameterName}"] [data-test-id="parameter-input-field"]`,
    )
    .fill(value);
}

async function selectOption(parameterName, optionText) {
  await page
    .locator(`[data-test-id="parameter-input-${parameterName}"]`)
    .getByRole("combobox", { name: "Select" })
    .click();
  await page.getByRole("option", { name: optionText }).click();
}

// --- Test flow ---

try {
  // Dismiss onboarding
  console.log("4. Dismissing onboarding...");
  await page.goto(`${N8N_URL}/home/workflows`);
  await page.waitForTimeout(2000);

  for (const buttonName of [
    "Skip",
    "Get started",
    "Close",
    "Dismiss",
    "Not now",
  ]) {
    const button = page.getByRole("button", { name: buttonName });

    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(500);
    }
  }

  // Create workflow
  console.log("5. Creating workflow...");
  await page.goto(`${N8N_URL}/workflow/new`);
  await page.waitForTimeout(2000);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  await page.getByRole("group").click();
  await page
    .locator('[data-test-id="node-creator-node-item"]')
    .first()
    .click();

  // Add Iteration Layer node
  console.log("6. Adding Iteration Layer node...");
  await page
    .locator('[data-test-id="node-creator-plus-button"]')
    .click();
  await page
    .locator('[data-test-id="node-creator-search-bar"]')
    .fill("Iteration Layer");
  await page.locator('[data-test-id="node-creator-node-item"]').click();
  await page.getByRole("button", { name: "Add to workflow" }).click();
  await page.waitForTimeout(1000);
  await page
    .locator('[data-test-id="node-execute-button"]')
    .waitFor({ timeout: 5_000 });

  // --- Document Extraction ---
  console.log("7. Testing Document Extraction...");
  await page.getByRole("button", { name: "Add File" }).first().click();
  await selectOption("fileInputMode", "URL");
  await fillInput("fileUrl", "https://pdfobject.com/pdf/sample.pdf");
  await fillInput("fileName", "sample.pdf");

  await page.getByRole("button", { name: "Add Field" }).first().click();
  await fillInput("name", "title");
  await fillInput("description", "The title of the document");

  await executeAndExpectSuccess();
  console.log("   ✓ Document Extraction passed");

  // --- Document to Markdown ---
  console.log("8. Testing Document to Markdown...");
  await selectResource("Document to Markdown Convert");
  await selectOption("fileInputMode", "URL");
  await fillInput("fileUrl", "https://pdfobject.com/pdf/sample.pdf");
  await fillInput("fileName", "sample.pdf");

  await executeAndExpectSuccess();
  console.log("   ✓ Document to Markdown passed");

  // --- Image Transformation ---
  console.log("9. Testing Image Transformation...");
  await selectResource("Image Transformation Resize,");
  await fillInput("fileUrl", "https://picsum.photos/id/237/800/600");
  await fillInput("fileName", "photo.jpg");
  await page
    .getByRole("button", { name: "Add Operation" })
    .first()
    .click();

  await executeAndExpectSuccess();
  console.log("   ✓ Image Transformation passed");

  // --- Image Generation ---
  console.log("10. Testing Image Generation...");
  await selectResource("Image Generation Generate");

  await executeAndExpectSuccess();
  console.log("   ✓ Image Generation passed");

  // --- Document Generation ---
  console.log("11. Testing Document Generation...");
  await selectResource("Document Generation Generate");

  await executeAndExpectSuccess();
  console.log("   ✓ Document Generation passed");

  // --- Sheet Generation ---
  console.log("12. Testing Sheet Generation...");
  await selectResource("Sheet Generation Generate");

  await executeAndExpectSuccess();
  console.log("   ✓ Sheet Generation passed");

  console.log("\nAll tests passed!");
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  await page.screenshot({ path: join(__dirname, "debug-failure.png") });
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
