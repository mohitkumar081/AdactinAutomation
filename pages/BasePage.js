const { test, expect } = require("@playwright/test");

/**
 * Core / generalized modular methods shared by every Page Object.
 * Covers navigation, explicit + implicit-style waits, common actions,
 * screenshots/attachments, logging and alert/popup handling.
 */
class BasePage {
  constructor(page) {
    this.page = page;
  }

  // ------------------------------------------------------------------
  // Logging (appears in console and as an Allure text attachment)
  // ------------------------------------------------------------------
  log(message) {
    console.log(message);
  }

  async attachLog(name, message) {
    await test.info().attach(name, {
      body: String(message),
      contentType: "text/plain",
    });
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  // Manual Part 05 uses navigate(url); navigateTo() is kept as an alias.
  async navigate(url) {
    return this.navigateTo(url);
  }

  async navigateTo(url) {
    return test.step(`Navigate to ${url}`, async () => {
      const response = await this.page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      this.log(`Navigated to ${url}`);
      return response;
    });
  }

  async waitForLoadState(state = "domcontentloaded", timeout = 60000) {
    await this.page.waitForLoadState(state, { timeout });
  }

  async waitForURL(pattern, timeout = 60000, waitUntil = "domcontentloaded") {
    await this.page.waitForURL(pattern, { timeout, waitUntil });
    this.log(`URL matched: ${pattern}`);
  }

  // ------------------------------------------------------------------
  // Wait conditions
  // ------------------------------------------------------------------
  // Playwright has no true implicit wait; this emulates it globally.
  setImplicitTimeout(milliseconds = 30000) {
    this.page.setDefaultTimeout(milliseconds);
  }

  async waitForVisible(locator, timeout = 30000, name = "element") {
    await expect(locator).toBeVisible({ timeout });
    this.log(`${name} is visible`);
    return locator;
  }

  async waitForHidden(locator, timeout = 30000, name = "element") {
    await expect(locator).toBeHidden({ timeout });
    this.log(`${name} is hidden`);
  }

  async waitForEnabled(locator, timeout = 30000, name = "element") {
    await expect(locator).toBeEnabled({ timeout });
    return locator;
  }

  async waitForText(locator, text, timeout = 30000) {
    await expect(locator).toHaveText(text, { timeout });
  }

  // ------------------------------------------------------------------
  // Common actions
  // ------------------------------------------------------------------
  async click(locator, name = "element", options = {}) {
    return test.step(`Click: ${name}`, async () => {
      await this.waitForEnabled(locator, 30000, name);
      await locator.click(options);
    });
  }

  async fill(locator, value, name = "field") {
    return test.step(`Fill: ${name}`, async () => {
      await locator.fill(value);
    });
  }

  async select(locator, value, name = "dropdown") {
    return test.step(`Select: ${name}`, async () => {
      await locator.selectOption(value);
    });
  }

  async check(locator, name = "checkbox/radio") {
    return test.step(`Check: ${name}`, async () => {
      await locator.check();
    });
  }

  // ------------------------------------------------------------------
  // Screenshots / attachments (PDF Part 04, Step 07)
  // ------------------------------------------------------------------
  /** Attaches a PNG to the current test (shows in Allure / HTML report). */
  async attachScreenshot(name) {
    await test.info().attach(name, {
      body: await this.page.screenshot(),
      contentType: "image/png",
    });
    this.log(`Screenshot attached: ${name}`);
  }

  // ------------------------------------------------------------------
  // Alerts / popups
  // ------------------------------------------------------------------
  async handleAlert(action = "accept", promptText = "", timeout = 10000) {
    return test.step(`Handle alert (${action})`, async () => {
      try {
        const dialog = await this.page.waitForEvent("dialog", { timeout });
        const message = dialog.message();
        if (action === "accept") {
          await dialog.accept(promptText);
        } else {
          await dialog.dismiss();
        }
        this.log(`Alert handled (${action}): ${message}`);
        return message;
      } catch {
        this.log("No alert appeared within the timeout");
        return null;
      }
    });
  }

  async handlePopup(action = async (popup) => popup.waitForLoadState()) {
    return test.step("Handle popup window", async () => {
      try {
        const [popup] = await Promise.all([
          this.page.waitForEvent("popup", { timeout: 10000 }),
        ]);
        await action(popup);
        return popup;
      } catch {
        this.log("No popup appeared within the timeout");
        return null;
      }
    });
  }

  // ------------------------------------------------------------------
  // Generalized Adactin login / logout
  // ------------------------------------------------------------------
  async doLogin(username, password) {
    return test.step("Login", async () => {
      await this.fill(this.page.locator("#username"), username, "username");
      await this.fill(this.page.locator("#password"), password, "password");
      await this.attachScreenshot("Login - credentials entered");
      await this.click(this.page.locator("#login"), "Login button");
      await this.attachScreenshot("After clicking Login");
    });
  }

  async doLogout(logoutLocator) {
    const link =
      logoutLocator ||
      this.page.getByRole("link", { name: /^Logout$/i });

    return test.step("Logout", async () => {
      // The Booked Itinerary page has thousands of rows and its navigation
      // settles very slowly. Do not block click() on that navigation;
      // waitForURL() below performs the real logout verification.
      await this.click(link, "Logout link", { noWaitAfter: true });
      // The heavy itinerary page can prevent the logout page's `load` event
      // from ever settling, so wait only for DOM readiness and allow extra time.
      await this.waitForURL(/Logout\.php/, 180000, "domcontentloaded");
      await expect(
        this.page.getByText("You have successfully logged out."),
      ).toBeVisible({ timeout: 120000 });
      await this.attachScreenshot("Logout - successful");
      await this.click(
        this.page.getByRole("link", { name: /Click here to login again/i }),
        "Click here to login again",
      );
      await this.waitForVisible(this.page.locator("#username"), 60000, "username");
    });
  }
}

module.exports = BasePage;
