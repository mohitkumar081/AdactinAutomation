const { test, expect } = require("../fixtures/testSetup");

const LoginPage = require("../pages/LoginPage");
const SearchHotelPage = require("../pages/SearchHotelPage");
const SelectHotelPage = require("../pages/SelectHotelPage");
const BookingPage = require("../pages/BookingPage");

const { load, loginUser } = require("../utils/testdata");
const loginData = load("loginData");
const validUser = loginUser();
const searchData = require("../testdata/searchData.json");
const bookingData = require("../testdata/bookingData.json");



test("TC-07: Login with Invalid Credentials", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();

  await loginPage.login(
    loginData.invalidUser.username,
    loginData.invalidUser.password,
  );

  await expect(loginPage.errorMessage).toBeVisible();

  await expect(loginPage.errorMessage).toContainText("Invalid Login details");

  await expect(page).not.toHaveURL(/SearchHotel\.php/);

  console.log("TC-07: Invalid login test passed.");
});



test("TC-08: Search Hotel with Missing Mandatory Fields", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);

  // Login
  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  // Verify Search Hotel Page
  await expect(page).toHaveURL(/SearchHotel\.php/);

  // Click Search without selecting Location
  await searchPage.searchButton.click();

  // Verify validation message
  await expect(page.getByText("Please Select a Location")).toBeVisible();

  console.log("TC-08: Missing mandatory search field test passed.");
});


test("TC-09: Booking Hotel with Missing Mandatory Details", async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);
  const selectHotelPage = new SelectHotelPage(page);
  const bookingPage = new BookingPage(page);

  // Login
  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  // Generate Dynamic Dates
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

  // Search Hotel
  await searchPage.searchHotel(
    searchData.validSearch,
    formatDate(checkIn),
    formatDate(checkOut),
  );

  // Select First Hotel
  await selectHotelPage.selectFirstHotel();

  // Verify Booking Page
  await expect(page).toHaveURL(/BookHotel\.php/);

  // Leave all booking fields empty and click Book Now
  await bookingPage.bookNowButton.click();

  // Verify First Name validation error
  await expect(bookingPage.firstNameError).toBeVisible();

  // Verify user remains on Booking Page
  await expect(page).toHaveURL(/BookHotel\.php/);

  console.log("TC-09: Missing booking details test passed.");
});





test("TC-10: Booking with Invalid Credit Card Details", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const searchPage = new SearchHotelPage(page);
  const selectHotelPage = new SelectHotelPage(page);
  const bookingPage = new BookingPage(page);

  // Login
  await loginPage.navigate();

  await loginPage.login(
    validUser.username,
    validUser.password,
  );

  // Dynamic Dates
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

  // Search Hotel
  await searchPage.searchHotel(
    searchData.validSearch,
    formatDate(checkIn),
    formatDate(checkOut),
  );

  // Select Hotel
  await selectHotelPage.selectFirstHotel();

  // Fill Booking Details with Invalid Card Data
  await bookingPage.firstName.fill(bookingData.invalidCard.firstName);
  await bookingPage.lastName.fill(bookingData.invalidCard.lastName);
  await bookingPage.address.fill(bookingData.invalidCard.address);
  await bookingPage.creditCardNumber.fill(
    bookingData.invalidCard.creditCardNumber,
  );

  await bookingPage.creditCardType.selectOption(
    bookingData.invalidCard.creditCardType,
  );

  await bookingPage.expiryMonth.selectOption(
    bookingData.invalidCard.expiryMonth,
  );

  await bookingPage.expiryYear.selectOption(bookingData.invalidCard.expiryYear);

  await bookingPage.cvv.fill(bookingData.invalidCard.cvv);

  // Click Book Now
  await bookingPage.bookNowButton.click();

  // Verify Credit Card Validation
  await expect(bookingPage.creditCardError).toBeVisible();

  // Verify booking was not completed
  await expect(page).toHaveURL(/BookHotel\.php/);

  console.log("TC-10: Invalid credit card test passed.");
});





test("TC-11: Access Booking Confirmation Without Login", async ({ page }) => {
  // Directly access Booking Confirmation page without login
  await page.goto("https://adactinhotelapp.com/BookingConfirm.php");

  // Verify user cannot access booking confirmation
  await expect(page).not.toHaveURL(/BookingConfirm\.php/);

  // Verify Login Form is displayed
  await expect(page.locator("#username")).toBeVisible();
  await expect(page.locator("#password")).toBeVisible();
  await expect(page.locator("#login")).toBeVisible();

  console.log("TC-11: Unauthorized booking confirmation access test passed.");
});