const { test } = require("../fixtures/testSetup");
const { attachStepScreenshot } = require("../utils/screenshotutil");
const { APP_URL } = require("../utils/config");

class LoginPage {
  constructor(page) {
    this.page = page;

    this.username = page.locator("#username");
    this.password = page.locator("#password");
    this.loginButton = page.locator("#login");
    this.message = page.locator(".welcome_menu");
    this.errorMessage = page.locator(".auth_error");
  }

  async navigate() {
    await test.step("Navigate to application", async () => {
      await this.page.goto(APP_URL, { waitUntil: "domcontentloaded" });
      await attachStepScreenshot(this.page, "00 - After URL open");
    });
  }

  async login(username, password) {
    await test.step("After URL open", async () => {
      await attachStepScreenshot(this.page, "01 - After URL open");
    });

    await test.step("Enter username", async () => {
      await this.username.fill(username);
      await attachStepScreenshot(this.page, "02 - After username");
    });

    await test.step("Enter password", async () => {
      await this.password.fill(password);
      await attachStepScreenshot(this.page, "03 - After password");
    });

    await test.step("Click Login", async () => {
      await this.loginButton.click();
      await attachStepScreenshot(this.page, "04 - After login click");
    });
  }
}

module.exports = LoginPage;
