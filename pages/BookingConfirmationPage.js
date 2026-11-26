const { test } = require("@playwright/test");
const BasePage = require("./BasePage");

class BookingConfirmationPage extends BasePage {
  constructor(page) {
    super(page);

    this.orderNumber = page.locator("#order_no");
    this.hotelName = page.locator("#hotel_name");
    this.location = page.locator("#location");
    this.firstName = page.locator("#first_name");
    this.lastName = page.locator("#last_name");
    this.logoutButton = page.locator("#logout");
  }

  async getOrderNumber() {
    return test.step("Read generated order number", async () => {
      return await this.orderNumber.inputValue();
    });
  }

  async logout() {
    await this.doLogout(this.logoutButton);
  }
}

module.exports = BookingConfirmationPage;
