const { test } = require("@playwright/test");
const { SCREENSHOT_TIMEOUT } = require("./config");

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

async function attachScreenshotAfterEach(page, testInfo) {
  if (page.isClosed()) return;

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

    console.log(
      `Screenshot could not be attached for "${testInfo.title}": ${error.message}`,
    );
  }
}

module.exports = {
  attachStepScreenshot,
  attachScreenshotAfterEach,
};
