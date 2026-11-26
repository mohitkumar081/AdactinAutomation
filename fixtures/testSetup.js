const { test: base, expect } = require("@playwright/test");

const BasePage = require("../pages/BasePage");
const { APP_URL } = require("../utils/config");
const { attachScreenshotAfterEach } = require("../utils/screenshotutil");

/**
 * Manual Part 05, Step 04: Hooks + Allure.
 *
 * Playwright owns browser/context/page creation and closure through its built-in
 * fixtures. These hooks add the project-specific lifecycle around them:
 *   beforeAll  - suite-level init marker
 *   auto       - open APP_URL before every test (beforeEach equivalent)
 *   afterEach  - lifecycle log + final/failure screenshots
 *   afterAll   - suite-level teardown marker
 */
const test = base.extend({
  pageSetup: [
    async ({ page }, use) => {
      const basePage = new BasePage(page);
      await basePage.navigate(APP_URL);
      await use();
    },
    { auto: true },
  ],
});

test.beforeAll(async () => {
  console.log("[hooks] UI suite setup — browser fixtures ready");
});

test.afterAll(async () => {
  console.log("[hooks] UI suite teardown — reports flushed by Playwright");
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach("Test lifecycle", {
    body: `status=${testInfo.status}; project=${testInfo.project.name}; retry=${testInfo.retry}`,
    contentType: "text/plain",
  });
  await attachScreenshotAfterEach(page, testInfo);
});

module.exports = { test, expect };
