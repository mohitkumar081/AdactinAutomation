const BasePage = require("./BasePage");

class SearchHotelPage extends BasePage {
  constructor(page) {
    super(page);

    this.location = page.locator("#location");
    this.hotels = page.locator("#hotels");
    this.roomType = page.locator("#room_type");
    this.numberOfRooms = page.locator("#room_nos");
    this.checkInDate = page.locator("#datepick_in");
    this.checkOutDate = page.locator("#datepick_out");
    this.adultsPerRoom = page.locator("#adult_room");
    this.childrenPerRoom = page.locator("#child_room");

    this.searchButton = page.locator("#Submit");
    this.resetButton = page.locator("#Reset");
  }

  async searchHotel(data, checkIn, checkOut) {
    await this.select(this.location, { label: data.location }, "location");
    await this.select(this.hotels, { label: data.hotel }, "hotel");
    await this.select(this.roomType, { label: data.roomType }, "room type");
    await this.select(this.numberOfRooms, data.numberOfRooms, "number of rooms");

    await this.fill(this.checkInDate, checkIn, "check-in date");
    await this.fill(this.checkOutDate, checkOut, "check-out date");

    await this.select(this.adultsPerRoom, data.adultsPerRoom, "adults per room");
    await this.select(
      this.childrenPerRoom,
      data.childrenPerRoom,
      "children per room",
    );

    await this.click(this.searchButton, "Search button");
  }
}

module.exports = SearchHotelPage;
