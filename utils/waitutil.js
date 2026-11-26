const { expect } = require("@playwright/test");

function setImplicitTimeout(page, milliseconds = 30000) {
  page.setDefaultTimeout(milliseconds);
}

async function waitForLoadState(page, state = "domcontentloaded", timeout = 60000) {
  await page.waitForLoadState(state, { timeout });
}

async function waitForURL(page, pattern, timeout = 60000, waitUntil = "domcontentloaded") {
  await page.waitForURL(pattern, { timeout, waitUntil });
}

async function waitForVisible(locator, timeout = 30000, name = "element") {
  await expect(locator).toBeVisible({ timeout });
  return locator;
}

async function waitForHidden(locator, timeout = 30000) {
  await expect(locator).toBeHidden({ timeout });
}

async function waitForEnabled(locator, timeout = 30000) {
  await expect(locator).toBeEnabled({ timeout });
  return locator;
}

async function waitForText(locator, text, timeout = 30000) {
  await expect(locator).toHaveText(text, { timeout });
}

module.exports = {
  setImplicitTimeout,
  waitForLoadState,
  waitForURL,
  waitForVisible,
  waitForHidden,
  waitForEnabled,
  waitForText,
};
