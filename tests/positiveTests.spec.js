const { test, expect } = require("../fixtures/testSetup");

const LoginPage = require("../pages/LoginPage");
const SearchHotelPage = require("../pages/SearchHotelPage");
const SelectHotelPage = require("../pages/SelectHotelPage");
const BookingPage = require("../pages/BookingPage");
const BookingConfirmationPage = require("../pages/BookingConfirmationPage");

const { loginUser } = require("../utils/testdata");
const validUser = loginUser();
const searchData = require("../testdata/searchData.json");
const bookingData = require("../testdata/bookingData.json");


function getBookingDates() {
  const today = new Date();

  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 1);

  const checkOut = new Date(today);
  checkOut.setDate(today.getDate() + 2);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return {
    checkIn: formatDate(checkIn),
    checkOut: formatDate(checkOut),
  };
}


async function completeHotelBooking(page) {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);
  const selectHotelPage = new SelectHotelPage(page);
  const bookingPage = new BookingPage(page);


  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  await expect(page).toHaveURL(/SearchHotel\.php/);


  const dates = getBookingDates();


  await searchPage.searchHotel(
    searchData.validSearch,
    dates.checkIn,
    dates.checkOut,
  );

  await expect(page).toHaveURL(/SelectHotel\.php/);


  await selectHotelPage.selectFirstHotel();

  await expect(page).toHaveURL(/BookHotel\.php/);


  await bookingPage.fillBookingDetails(bookingData.validBooking);


  await bookingPage.bookHotel();

  await page.waitForURL(/BookingConfirm\.php/, {
    timeout: 60000,
  });
}


test("TC-02: Successful Login with Valid Credentials", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();

  await expect(page).toHaveTitle(/Adactin.com/);

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  await expect(page).toHaveURL(/SearchHotel\.php/);

  await expect(page.locator("#location")).toBeVisible();

  console.log("TC-02: Login successful");
});


test("TC-03: Successful Hotel Search with Valid Details", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);


  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  await expect(page).toHaveURL(/SearchHotel\.php/);


  const dates = getBookingDates();


  await searchPage.searchHotel(
    searchData.validSearch,
    dates.checkIn,
    dates.checkOut,
  );


  await expect(page).toHaveURL(/SelectHotel\.php/);

  await expect(
    page.locator("#radiobutton_0, #radiobutton_1").first(),
  ).toBeVisible();

  console.log("TC-03: Hotel search successful");
});


test("TC-04: Successful Hotel Selection and Booking", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);
  const selectHotelPage = new SelectHotelPage(page);
  const bookingPage = new BookingPage(page);


  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  await expect(page).toHaveURL(/SearchHotel\.php/);


  const dates = getBookingDates();


  await searchPage.searchHotel(
    searchData.validSearch,
    dates.checkIn,
    dates.checkOut,
  );

  await expect(page).toHaveURL(/SelectHotel\.php/);


  await selectHotelPage.selectFirstHotel();

  await expect(page).toHaveURL(/BookHotel\.php/);


  await expect(bookingPage.hotelName).toBeVisible();
  await expect(bookingPage.location).toBeVisible();
  await expect(bookingPage.roomType).toBeVisible();
  await expect(bookingPage.numberOfRooms).toBeVisible();
  await expect(bookingPage.totalDays).toBeVisible();
  await expect(bookingPage.totalPrice).toBeVisible();
  await expect(bookingPage.gst).toBeVisible();
  await expect(bookingPage.finalPrice).toBeVisible();
  await expect(bookingPage.firstName).toBeVisible();


  await bookingPage.fillBookingDetails(bookingData.validBooking);


  await expect(bookingPage.bookNowButton).toBeEnabled();

  await bookingPage.bookHotel();


  await page.waitForURL(/BookingConfirm\.php/, {
    timeout: 60000,
  });

  const orderNumberField = page.locator("#order_no");

  await expect(orderNumberField).toBeVisible({
    timeout: 30000,
  });

  const orderNumber = await orderNumberField.inputValue();

  console.log("Booking Confirmation URL:", page.url());
  console.log("Generated Booking ID:", orderNumber);

  expect(orderNumber).not.toBe("");

  console.log("TC-04: Hotel booking successful");
});


test("TC-05: Verify Booking Confirmation and Order Number", async ({
  page,
}) => {
  const confirmationPage = new BookingConfirmationPage(page);


  await completeHotelBooking(page);


  await expect(page).toHaveURL(/BookingConfirm\.php/);

  await expect(confirmationPage.orderNumber).toBeVisible();

  const orderNumber = await confirmationPage.getOrderNumber();

  expect(orderNumber.trim()).not.toBe("");

  console.log("Booking Order Number:", orderNumber);
  console.log("TC-05: Booking confirmation verified");
});


test("TC-06: Successful Logout After Booking", async ({ page }) => {
  const confirmationPage = new BookingConfirmationPage(page);


  await completeHotelBooking(page);


  await expect(confirmationPage.orderNumber).toBeVisible();

  const orderNumber = await confirmationPage.getOrderNumber();

  expect(orderNumber.trim()).not.toBe("");

  console.log("Booking Order Number:", orderNumber);


  await confirmationPage.logout();

  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();

  console.log("TC-06: Booking completed and user logged out successfully");
});
