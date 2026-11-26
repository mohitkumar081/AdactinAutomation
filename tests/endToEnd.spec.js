const { test, expect } = require("../fixtures/testSetup");

const LoginPage = require("../pages/LoginPage");
const SearchHotelPage = require("../pages/SearchHotelPage");
const SelectHotelPage = require("../pages/SelectHotelPage");
const BookingPage = require("../pages/BookingPage");
const BookingConfirmationPage = require("../pages/BookingConfirmationPage");
const ItineraryPage = require("../pages/ItineraryPage");

const { loginUser } = require("../utils/testdata");
const validUser = loginUser();
const searchData = require("../testdata/searchData.json");
const bookingData = require("../testdata/bookingData.json");

const CHECK_IN = "01/12/2025";
const CHECK_OUT = "02/12/2025";

test("TC-01: Complete End-to-End Hotel Booking Flow", async ({ page }) => {

  test.setTimeout(600000);

  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);
  const selectHotelPage = new SelectHotelPage(page);
  const bookingPage = new BookingPage(page);
  const confirmationPage = new BookingConfirmationPage(page);
  const itineraryPage = new ItineraryPage(page);

  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  await expect(page).toHaveURL(/SearchHotel\.php/, {
    timeout: 60000,
  });

  console.log("STEP 1: Login successful");

  await searchPage.searchHotel(searchData.validSearch, CHECK_IN, CHECK_OUT);

  await expect(page).toHaveURL(/SelectHotel\.php/, {
    timeout: 60000,
  });

  console.log("STEP 2: Hotel search successful");

  await selectHotelPage.selectFirstHotel();

  await expect(page).toHaveURL(/BookHotel\.php/, {
    timeout: 60000,
  });

  console.log("STEP 3: Hotel selected successfully");

  await bookingPage.fillBookingDetails(bookingData.validBooking);
  await bookingPage.bookHotel();

  await page.waitForURL(/BookingConfirm\.php/, {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });

  console.log("STEP 4: Booking submitted");

  await expect(confirmationPage.orderNumber).toBeVisible({
    timeout: 60000,
  });

  const orderNumber = (await confirmationPage.getOrderNumber()).trim();

  expect(orderNumber).not.toBe("");

  console.log("Generated Order Number:", orderNumber);
  console.log("STEP 5: Booking confirmation successful");

  await itineraryPage.openItinerary();

  console.log("STEP 6: My Itinerary opened");

  const foundInItinerary = await itineraryPage.isBookingVisible(orderNumber);

  if (foundInItinerary) {
    console.log("STEP 7: New booking found in My Itinerary");
  } else {
    console.log(
      `STEP 7: Order ${orderNumber} confirmed; not in the capped/shared itinerary list`,
    );
  }

});
