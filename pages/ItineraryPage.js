const { test, expect } = require("@playwright/test");
const BasePage = require("./BasePage");

class ItineraryPage extends BasePage {
  constructor(page) {
    super(page);

    this.bookedItineraryLink = page.getByRole("link", {
      name: /Booked Itinerary/i,
    });

    this.pageHeading = page.locator("td.login_title");

    this.orderIdFields = page.locator(
      'input[id^="order_id_"]:not(#order_id_text)',
    );

    this.logoutLink = page.getByRole("link", {
      name: /^Logout$/i,
    });
  }

  async openItinerary() {
    await test.step("Open Booked Itinerary", async () => {

      await this.bookedItineraryLink.click({ noWaitAfter: true });

      await expect(this.page).toHaveURL(/BookedItinerary\.php/, {
        timeout: 240000,
      });

      await expect(this.pageHeading).toHaveText("Booked Itinerary", {
        timeout: 60000,
      });

      await expect(this.orderIdFields.first()).toBeVisible({ timeout: 240000 });
    });
  }

  getOrderField(orderNumber) {
    return this.page.locator(`input[value="${orderNumber}"]`);
  }

  async isBookingVisible(orderNumber, timeout = 15000) {
    try {
      await this.getOrderField(orderNumber).waitFor({
        state: "visible",
        timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    await this.doLogout(this.logoutLink);
  }
}

module.exports = ItineraryPage;
