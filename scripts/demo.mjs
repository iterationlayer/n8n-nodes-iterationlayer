import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import http from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const N8N_DIR = join(__dirname, "..");
const PROJECT_ROOT = join(N8N_DIR, "..", "..");

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const AUTH_COOKIE = process.env.N8N_AUTH_COOKIE;
const N8N_EMAIL = process.env.N8N_EMAIL || "demo@iterationlayer.com";
const N8N_PASSWORD = process.env.N8N_PASSWORD || "DemoPassword123!";
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_CREDENTIAL_BASE_URL = process.env.N8N_CREDENTIAL_BASE_URL;
const OUTPUT_DIR = process.env.DEMO_OUTPUT_DIR || N8N_DIR;
const VIDEO_DIR = join(OUTPUT_DIR, "demo-videos");
const OUTPUT_PATH = join(OUTPUT_DIR, "demo.webm");
const PAUSE_IN_MS = 800;
const RESULT_PAUSE_IN_MS = 4_000;
const SECOND_SEGMENT_TRIM_IN_SECONDS = 3.0;
const PRICING_PAGE_URL = "https://iterationlayer.com/pricing";
const PACKAGE_NAME = process.env.N8N_DEMO_PACKAGE_NAME || "n8n-nodes-iterationlayer";

if (!AUTH_COOKIE) {
  console.error("N8N_AUTH_COOKIE environment variable is required");
  process.exit(1);
}

if (!N8N_API_KEY || !N8N_CREDENTIAL_BASE_URL) {
  console.error("N8N_API_KEY and N8N_CREDENTIAL_BASE_URL environment variables are required");
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

let currentAuthCookieEntry = authCookieEntry;

// Dismiss onboarding in an unrecorded context
const setupContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await setupContext.addCookies([authCookieEntry]);
const setupPage = await setupContext.newPage();
await setupPage.goto(`${N8N_URL}/home/workflows`);
await setupPage.waitForTimeout(2_000);

async function dismissOnboarding(pageToClean) {
  for (const buttonName of ["Skip", "Get started", "Close", "Dismiss", "Not now"]) {
    const button = pageToClean.getByRole("button", { name: buttonName });

    if (await button.isVisible({ timeout: 300 }).catch(() => false)) {
      await button.click();
      await pageToClean.waitForTimeout(300);
    }
  }

  await pageToClean.keyboard.press("Escape");
  await pageToClean.waitForTimeout(300);
}

await dismissOnboarding(setupPage);
await setupPage.close();
await setupContext.close();

let context;
let page;
const recordedSegmentPaths = [];

async function createRecordedPage(storageState = undefined, initialUrl = `${N8N_URL}/home/workflows`) {
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    storageState,
  });

  await context.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = "* { cursor: none !important; }";
    document.head.appendChild(style);
  });

  if (!storageState) {
    await context.addCookies([currentAuthCookieEntry]);
  }
  page = await context.newPage();
  await page.goto(initialUrl);
  await page.waitForTimeout(1500);
  await dismissOnboarding(page);
}

async function prepareWorkflowBuilderOffCamera() {
  const prepContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await prepContext.addCookies([currentAuthCookieEntry]);
  const prepPage = await prepContext.newPage();

  await prepPage.goto(`${N8N_URL}/workflow/new`);
  await prepPage.waitForTimeout(2000);
  await dismissOnboarding(prepPage);
  await prepPage.keyboard.press("Escape");
  await prepPage.waitForTimeout(PAUSE_IN_MS);

  const storageState = await prepContext.storageState();

  await prepPage.close();
  await prepContext.close();

  return storageState;
}

async function closeRecordedPage() {
  if (!page || !context) {
    return;
  }

  const videoPath = await page.video()?.path();
  await page.close();
  await context.close();

  if (videoPath && existsSync(videoPath)) {
    recordedSegmentPaths.push(videoPath);
  }

  page = undefined;
  context = undefined;
}

// Helpers

async function pause() {
  await page.waitForTimeout(PAUSE_IN_MS);
}

async function pausePage(pageToPause) {
  await pageToPause.waitForTimeout(PAUSE_IN_MS);
}

async function showResult(durationInMs = RESULT_PAUSE_IN_MS) {
  await page.waitForTimeout(durationInMs);
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

async function waitForN8nHealth(timeoutInMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutInMs) {
    try {
      const response = await fetch(`${N8N_URL}/healthz`);

      if (response.ok) {
        return;
      }
    } catch (_error) {
      // Ignore until the service comes back.
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`n8n did not become healthy within ${timeoutInMs}ms`);
}

function runDockerComposeCommand(argumentsList) {
  execFileSync("docker", ["compose", ...argumentsList], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
}

async function setupOwnerAndGetCookie() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 120_000) {
    const setupResponse = await postJson('/rest/owner/setup', {
      email: N8N_EMAIL,
      password: N8N_PASSWORD,
      firstName: 'Demo',
      lastName: 'User',
    });

    const loginResponse = await postJson('/rest/login', {
      emailOrLdapLoginId: N8N_EMAIL,
      password: N8N_PASSWORD,
    });

    const setCookieHeader = setupResponse.setCookie ?? loginResponse.setCookie;

    if (setCookieHeader) {
      const [cookie] = setCookieHeader.split(';');
      const [name, ...valueParts] = cookie.split('=');

      currentAuthCookieEntry = {
        name,
        value: valueParts.join('='),
        domain: new URL(N8N_URL).hostname,
        path: '/',
      };

      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Could not get n8n auth cookie after resetting to local image');
}

function postJson(pathname, body, extraHeaders = {}) {
  const url = new URL(pathname, N8N_URL);

  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...extraHeaders,
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            body: Buffer.concat(chunks).toString('utf8'),
            setCookie: response.headers['set-cookie']?.at(0),
          });
        });
      },
    );

    request.on('error', reject);
    request.write(JSON.stringify(body));
    request.end();
  });
}

async function createCredential() {
  const response = await postJsonWithCookie('/rest/credentials', {
    name: 'Iteration Layer account',
    type: 'iterationLayerApi',
    data: {
      apiKey: N8N_API_KEY,
      baseUrl: N8N_CREDENTIAL_BASE_URL,
    },
  });

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Could not create Iteration Layer credential: ${response.body}`);
  }
}

function postJsonWithCookie(pathname, body) {
  const cookieHeader = `${currentAuthCookieEntry.name}=${currentAuthCookieEntry.value}`;
  return postJson(pathname, body, { cookie: cookieHeader });
}

async function installCommunityNode() {
  console.log("Showing community node installation...");
  await page.goto(`${N8N_URL}/settings/community-nodes`);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Install a community node" }).click();
  await pause();
  await page.locator('input[name="packageNameInput"]').fill(PACKAGE_NAME);
  await pause();
  await page.getByText("I understand the risks of installing unverified code from a public source.").click();
  await pause();
  await page.locator('[data-test-id="install-community-package-button"]').click();

  await page.waitForFunction(
    (packageName) => document.body.innerText.includes(packageName) && document.body.innerText.includes("Package installed"),
    PACKAGE_NAME,
    { timeout: 120_000 },
  );

  // Keep the installed node list visible briefly so the video shows the
  // package as installed before we cut to the next segment.
  await page.waitForTimeout(2_500);
}

async function activateLocalNodeBuild() {
  console.log("Resetting n8n to the clean local image state...");
  runDockerComposeCommand(["--profile", "n8n", "down", "--volumes"]);
  runDockerComposeCommand(["--profile", "n8n", "up", "n8n", "-d"]);
  await waitForN8nHealth();
  await setupOwnerAndGetCookie();
  await createCredential();
}

function concatenateVideos(segmentPaths, outputPath) {
  if (segmentPaths.length === 1) {
    copyFileSync(segmentPaths[0], outputPath);
    return;
  }

  const ffmpegArgs = ["-y"];

  ffmpegArgs.push("-i", segmentPaths[0]);
  ffmpegArgs.push("-ss", SECOND_SEGMENT_TRIM_IN_SECONDS.toString(), "-i", segmentPaths[1]);

  for (const segmentPath of segmentPaths.slice(2)) {
    ffmpegArgs.push("-i", segmentPath);
  }

  const filterInputs = segmentPaths.map((_, index) => `[${index}:v]`).join("");

  ffmpegArgs.push(
    "-filter_complex",
    `${filterInputs}concat=n=${segmentPaths.length}:v=1:a=0[v]`,
    "-map",
    "[v]",
    "-c:v",
    "libvpx-vp9",
    outputPath,
  );

  execFileSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
}

async function selectResource(optionText) {
  await pause();
  await page
    .locator('[data-test-id="parameter-input-resource"]')
    .getByRole("combobox", { name: "Select" })
    .click();
  await pause();

  const exactOption = page.getByRole("option", { name: optionText });

  if (await exactOption.isVisible({ timeout: 500 }).catch(() => false)) {
    await exactOption.click();
    await pause();
    return;
  }

  await page.getByRole("option").filter({ hasText: optionText }).first().click();
  await pause();
}

async function executeAndExpectSuccess() {
  await pause();
  await page.locator('[data-test-id="node-execute-button"]').click();
  await waitForExecution();
  const title = await page.title();

  if (title.includes("⚠️")) {
    const pageText = await page.locator("body").innerText().catch(() => "");
    throw new Error(`Execution failed (⚠️ in title)\n${pageText}`);
  }

  await showResult();
}

async function fillInput(parameterName, value) {
  await page
    .locator(
      `[data-test-id="parameter-input-${parameterName}"] [data-test-id="parameter-input-field"]:visible`,
    )
    .first()
    .fill(value);
  await pause();
}

async function selectOption(parameterName, optionText) {
  await page
    .locator(`[data-test-id="parameter-input-${parameterName}"]:visible`)
    .first()
    .getByRole("combobox", { name: "Select" })
    .click();
  await pause();
  await page.getByRole("option", { name: optionText }).click();
  await pause();
}

// Test flow

try {
  await waitForN8nHealth();

  await createRecordedPage();
  await installCommunityNode();
  await closeRecordedPage();

  await activateLocalNodeBuild();
  const workflowBuilderState = await prepareWorkflowBuilderOffCamera();
  await createRecordedPage(workflowBuilderState, `${N8N_URL}/workflow/new`);
  await pause();

  await page.getByRole("group").click();
  await pause();
  await page
    .locator('[data-test-id="node-creator-node-item"]')
    .first()
    .click();
  await pause();

  console.log("Adding Iteration Layer node...");
  await page.locator('[data-test-id="node-creator-plus-button"]').click();
  await pause();
  await page
    .locator('[data-test-id="node-creator-search-bar"]')
    .fill("Iteration Layer");
  await pause();
  await page.locator('[data-test-id="node-creator-node-item"]').first().click();
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
  await fillInput("fileUrl", "https://example.com/pricing.md");
  await fillInput("fileName", "pricing.md");

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
  await fillInput("fileUrl", "https://example.com/pricing.md");
  await fillInput("fileName", "pricing.md");

  await executeAndExpectSuccess();
  console.log("  ✓ Document to Markdown passed");

  // Website Extraction
  console.log("Testing Website Extraction...");
  await selectResource("Website Extraction");
  await fillInput("fileUrl", PRICING_PAGE_URL);
  await page.getByRole("button", { name: "Add Field" }).first().click();
  await pause();
  await fillInput("name", "pricing_summary");
  await fillInput("description", "A short summary of the pricing on the page");

  await executeAndExpectSuccess();
  console.log("  ✓ Website Extraction passed");

  // Image Transformation
  console.log("Testing Image Transformation...");
  await selectResource("Image Transformation Resize,");
  await selectOption("fileInputMode", "URL");
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
  process.exitCode = 0;
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  if (page) {
    await page.screenshot({ path: join(OUTPUT_DIR, "debug-failure.png") });
  }
  process.exitCode = 1;
} finally {
  if (page && context) {
    await closeRecordedPage();
  }

  if (recordedSegmentPaths.length > 0) {
    concatenateVideos(recordedSegmentPaths, OUTPUT_PATH);
    console.log(`Video saved to: ${OUTPUT_PATH}`);
  }

  await browser.close();
}
