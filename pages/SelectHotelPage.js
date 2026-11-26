const BasePage = require("./BasePage");

class SelectHotelPage extends BasePage {
  constructor(page) {
    super(page);

    this.firstHotel = page.locator("#radiobutton_0");
    this.continueButton = page.locator("#continue");
    this.cancelButton = page.locator("#cancel");
  }

  async selectFirstHotel() {
    await this.check(this.firstHotel, "first hotel radio button");
    await this.click(this.continueButton, "Continue button");
  }
}

module.exports = SelectHotelPage;
