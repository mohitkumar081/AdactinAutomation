const { test, expect } = require("@playwright/test");
const wait = require("../utils/waitutil");

class BasePage {
  constructor(page) {
    this.page = page;
  }

  log(message) {
    console.log(message);
  }

  async attachLog(name, message) {
    await test.info().attach(name, {
      body: String(message),
      contentType: "text/plain",
    });
  }

  async navigate(url) {
    return this.navigateTo(url);
  }

  async navigateTo(url) {
    return test.step(`Navigate to ${url}`, async () => {
      const response = await this.page.goto(url, {
        waitUntil: "domcontentloaded",
      });
      this.log(`Navigated to ${url}`);
      await this.attachLog("Navigation log", `Navigated to ${url}`);
      return response;
    });
  }

  async waitForLoadState(state = "domcontentloaded", timeout = 60000) {
    return wait.waitForLoadState(this.page, state, timeout);
  }

  async waitForURL(pattern, timeout = 60000, waitUntil = "domcontentloaded") {
    await wait.waitForURL(this.page, pattern, timeout, waitUntil);
    this.log(`URL matched: ${pattern}`);
  }

  setImplicitTimeout(milliseconds = 30000) {
    return wait.setImplicitTimeout(this.page, milliseconds);
  }

  async waitForVisible(locator, timeout = 30000, name = "element") {
    const found = await wait.waitForVisible(locator, timeout, name);
    this.log(`${name} is visible`);
    return found;
  }

  async waitForHidden(locator, timeout = 30000, name = "element") {
    await wait.waitForHidden(locator, timeout);
    this.log(`${name} is hidden`);
  }

  async waitForEnabled(locator, timeout = 30000) {
    return wait.waitForEnabled(locator, timeout);
  }

  async waitForText(locator, text, timeout = 30000) {
    return wait.waitForText(locator, text, timeout);
  }

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

  async attachScreenshot(name) {
    await test.info().attach(name, {
      body: await this.page.screenshot(),
      contentType: "image/png",
    });
    this.log(`Screenshot attached: ${name}`);
  }

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

      await this.click(link, "Logout link", { noWaitAfter: true });

      await this.waitForURL(/Logout\.php/, 180000, "domcontentloaded");
      await expect(
        this.page.getByText("You have successfully logged out."),
      ).toBeVisible({ timeout: 120000 });
      await this.attachLog("Logout log", "Logout verified; login page restored");
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
