const BasePage = require("./BasePage");

class BookingPage extends BasePage {
  constructor(page) {
    super(page);

    this.hotelName = page.locator("#hotel_name_dis");
    this.location = page.locator("#location_dis");
    this.roomType = page.locator("#room_type_dis");
    this.numberOfRooms = page.locator("#room_num_dis");
    this.totalDays = page.locator("#total_days_dis");
    this.pricePerNight = page.locator("#price_night_dis");
    this.totalPrice = page.locator("#total_price_dis");
    this.gst = page.locator("#gst_dis");
    this.finalPrice = page.locator("#final_price_dis");

    this.firstName = page.locator("#first_name");
    this.lastName = page.locator("#last_name");
    this.address = page.locator("#address");
    this.creditCardNumber = page.locator("#cc_num");
    this.creditCardType = page.locator("#cc_type");
    this.expiryMonth = page.locator("#cc_exp_month");
    this.expiryYear = page.locator("#cc_exp_year");
    this.cvv = page.locator("#cc_cvv");

    this.firstNameError = page.locator("#first_name_span");
    this.creditCardError = page.locator("#cc_num_span");

    this.bookNowButton = page.locator("#book_now");
    this.cancelButton = page.locator("#cancel");
  }

  async fillBookingDetails(data) {
    await this.fill(this.firstName, data.firstName, "first name");
    await this.fill(this.lastName, data.lastName, "last name");
    await this.fill(this.address, data.address, "address");
    await this.fill(
      this.creditCardNumber,
      data.creditCardNumber,
      "credit card number",
    );

    await this.select(
      this.creditCardType,
      { label: data.creditCardType },
      "credit card type",
    );
    await this.select(this.expiryMonth, data.expiryMonth, "expiry month");
    await this.select(this.expiryYear, data.expiryYear, "expiry year");

    await this.fill(this.cvv, data.cvv, "CVV");
    await this.attachScreenshot("Booking details filled");
  }

  async bookHotel() {
    await this.click(this.bookNowButton, "Book Now button");
  }
}

module.exports = BookingPage;
