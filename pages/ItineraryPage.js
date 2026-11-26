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
      // Do not let click() wait for this navigation: the public demo account
      // has thousands of bookings and the itinerary response streams slowly.
      await this.bookedItineraryLink.click({ noWaitAfter: true });

      await expect(this.page).toHaveURL(/BookedItinerary\.php/, {
        timeout: 240000,
      });

      await expect(this.pageHeading).toHaveText("Booked Itinerary", {
        timeout: 60000,
      });

      // Wait until at least one itinerary row has been rendered.
      await expect(this.orderIdFields.first()).toBeVisible({ timeout: 240000 });
    });
  }

  // Targeted CSS lookup, never evaluateAll() over every input on this page.
  getOrderField(orderNumber) {
    return this.page.locator(`input[value="${orderNumber}"]`);
  }

  // The shared account's itinerary is capped, so the newest booking may be
  // appended beyond the rendered portion. Best effort: returns a boolean.
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
