const { test } = require("@playwright/test");
const { SCREENSHOT_TIMEOUT } = require("./config");

/**
 * Capture a screenshot with one retry. Chromium inside Docker can briefly fail
 * Page.captureScreenshot while a navigation is still settling.
 */
async function captureScreenshot(page) {
  try {
    return await page.screenshot({
      animations: "disabled",
      timeout: SCREENSHOT_TIMEOUT,
    });
  } catch (error) {
    if (page.isClosed()) throw error;
    await page.waitForTimeout(500);
    return await page.screenshot({
      animations: "disabled",
      timeout: SCREENSHOT_TIMEOUT,
    });
  }
}

/**
 * During-test attachment (Allure / HTML report). Only call inside a running test.
 * Manual Part 05, Step 03. A missing screenshot must never fail a passing test.
 */
async function attachStepScreenshot(page, name) {
  try {
    await test.info().attach(name, {
      body: await captureScreenshot(page),
      contentType: "image/png",
    });
  } catch (error) {
    console.log(`Step screenshot "${name}" could not be attached: ${error.message}`);
    await test.info().attach(`${name} (screenshot unavailable)`, {
      body: `Screenshot unavailable: ${error.message}`,
      contentType: "text/plain",
    });
  }
}

/**
 * Post-test screenshots for reports; use only from test.afterEach.
 * Manual Part 05, Step 03 + Step 04.
 */
async function attachScreenshotAfterEach(page, testInfo) {
  if (page.isClosed()) return;

  // The shared account's Booked Itinerary page has thousands of rows, so a
  // screenshot there times out and adds noise. Step screenshots already cover
  // the booking flow; skip the post-test screenshot on that page.
  if (page.url().includes("BookedItinerary.php")) {
    console.log(
      `Skipping final screenshot on Booked Itinerary page for "${testInfo.title}"`,
    );
    return;
  }

  try {
    await testInfo.attach("Final Screenshot", {
      body: await captureScreenshot(page),
      contentType: "image/png",
    });

    if (testInfo.status !== testInfo.expectedStatus) {
      await testInfo.attach("Failure Screenshot", {
        body: await page.screenshot({
          animations: "disabled",
          timeout: SCREENSHOT_TIMEOUT,
        }),
        contentType: "image/png",
      });
    }
  } catch (error) {
    // Never let a screenshot problem turn a passing test into a failure.
    console.log(
      `Screenshot could not be attached for "${testInfo.title}": ${error.message}`,
    );
  }
}

module.exports = {
  attachStepScreenshot,
  attachScreenshotAfterEach,
};
