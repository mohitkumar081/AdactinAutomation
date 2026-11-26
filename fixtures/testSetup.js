const { test: base, expect } = require("@playwright/test");

const BasePage = require("../pages/BasePage");
const { APP_URL } = require("../utils/config");
const { attachScreenshotAfterEach } = require("../utils/screenshotutil");

/**
 * Manual Part 05, Step 04: Hooks + Allure.
 * Auto fixture opens the application before every test; afterEach attaches
 * Final / Failure screenshots to the report.
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

test.afterEach(async ({ page }, testInfo) => {
  await attachScreenshotAfterEach(page, testInfo);
});

module.exports = { test, expect };
