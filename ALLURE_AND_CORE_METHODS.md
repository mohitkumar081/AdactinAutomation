# Allure Reporting, Core Methods, Utilities & Hooks

Implemented as per **PART 04 (Allure Reporting)**, **PART 05 (Hooks in Playwright)** and **PART 06 (API Automation)** manuals.

## Final framework structure (manual Part 05, page 06)

```text
AdactinAutomation/
├── playwright.config.js        # Allure reporter already configured (Part 04)
├── pages/
│   ├── BasePage.js             # Core reusable methods + navigate(url)
│   ├── LoginPage.js            # test.step + step screenshots (manual Step 05)
│   ├── SearchHotelPage.js
│   ├── SelectHotelPage.js
│   ├── BookingPage.js
│   ├── BookingConfirmationPage.js
│   └── ItineraryPage.js
├── fixtures/
│   └── testSetup.js            # Hooks + Allure (auto navigation + afterEach)
├── utils/
│   ├── screenshotutil.js       # Screenshot utility
│   ├── apiUtil.js              # API helpers (schema/headers/time/payloads)
│   └── config.js               # Shared constants (APP_URL, timeouts)
├── testdata/
│   ├── loginData.json          # validUsers[] with ExpectedMsg (manual Step 07)
│   ├── searchData.json
│   ├── bookingData.json
│   └── apiData.json            # API endpoints/payloads/expected results/schemas
├── tests/
│   ├── positiveTests.spec.js   # TC-02 already covers the manual login example
│   ├── negativeTests.spec.js
│   ├── endToEnd.spec.js
│   └── api.spec.js             # GET / POST / PUT / DELETE (Part 06)
├── allure-results/             # generated
└── allure-report/              # generated
```

> NOTE: Manuals use ESM (`import`/`export default`). This project is CommonJS
> (`"type": "commonjs"`), so the same architecture is implemented with
> `require`/`module.exports`. Folder/file structure and behaviour are unchanged.
>
> Manual Step 06 (`login.spec.js`) is only an example. Our login coverage already
> exists in `positiveTests.spec.js` → TC-02, so no separate spec was added.

## 5) Allure Reporting (Part 04)
- `playwright.config.js` reporter: `[['list'], ['allure-playwright']]`
- Failure screenshots, retain-on-failure video, first-retry trace enabled.
- `allure-results/` → raw JSON/attachments; `allure-report/` → HTML report.

Commands:
```powershell
cd "C:\Users\Mohat Kumar\Desktop\AdactinAutomation"
npx playwright test --project=chromium --headed
npm run allure:generate
npm run allure:open
```

## 6) Core / Generalized Modular Methods
`pages/BasePage.js` provides:
- Navigation: `navigate()`, `navigateTo()`, `waitForURL()`, `waitForLoadState()`
- Explicit waits: `waitForVisible()`, `waitForHidden()`, `waitForEnabled()`, `waitForText()`
- Implicit-style wait: `setImplicitTimeout()`
- Common actions: `click()`, `fill()`, `select()`, `check()`
- Screenshots/attachments: `attachScreenshot()`, `attachLog()`
- Alerts/popups: `handleAlert()`, `handlePopup()`
- Generalized flows: `doLogin()`, `doLogout()`

## 7) Framework Core Structure

### Utilities layer
- `utils/screenshotutil.js`
  - `attachStepScreenshot(page, name)` — during-test step screenshot.
  - `attachScreenshotAfterEach(page, testInfo)` — `Final Screenshot` after every test,
    plus `Failure Screenshot` when status != expectedStatus.
- `utils/config.js` — `APP_URL`, timeout constants.

### Hooks (setup & teardown)
`fixtures/testSetup.js`:
- `base.extend({ pageSetup: [...] , { auto: true } })` opens `APP_URL` before every test.
- `test.afterEach()` attaches screenshots to Allure / HTML report.
- Exports `{ test, expect }`; UI specs import from this fixture file.
- API spec uses Playwright's built-in `request` fixture directly, so no browser
  navigation happens for API tests.
- Manual warning followed: **no global `let login` in `beforeEach`**.

## 8) API Automation (Part 06)
- `tests/api.spec.js` uses Playwright `request` fixture (APIRequestContext).
- API under test: `https://api-testing-postman.vercel.app/` (from the manual).
- Covers GET, POST (register/login), PUT (replace-account), DELETE.
- Validates status codes, JSON body, JSON schema, content-type header and
  response time. All values are data-driven from `testdata/apiData.json`.
- API results are written to the same `allure-results/` and appear in the same
  `allure-report/` as the UI tests.
- Public demo API occasionally returns transient 500/HTML errors; `send()` in
  `tests/api.spec.js` retries those up to 3 times. Tests run serially to avoid
  rate-limit flakiness.

API command:
```powershell
npm run test:api
```

## 9) Docker Deployment (Part 07)
- The container runs all 16 specs on Chromium (`5 API + 1 E2E + 5 negative +
  5 positive`). Verified inside `playwright-tests:latest` with
  `docker run --rm`: **16 passed (2.4m)**, no flakes or retries.
- The E2E spec ends after confirming the booking in My Itinerary; logout is
  verified separately by TC-06. The shared account's Booked Itinerary page is
  too heavy for a reliable logout navigation inside the E2E flow.
- `Dockerfile` is based on `mcr.microsoft.com/playwright:v1.65.0-jammy` (tag
  matches the Playwright version in `package-lock.json`), installs dependencies
  with `npm install`, copies the framework, runs
  `npx playwright install --with-deps`, and executes the Chromium suite via
  `CMD ["npx", "playwright", "test", "--project=chromium"]`.
- `ENV CI=true` makes `playwright.config.js` use a single worker with retries —
  important because the Adactin demo account and the public API are shared.
- `.dockerignore` excludes `node_modules`, `playwright-report`, `test-results`,
  `allure-results`, `allure-report` and `.git` from the build context.
- Chromium launches with `--disable-dev-shm-usage`, and step screenshots retry
  once and stay best-effort, so Docker's small `/dev/shm` cannot fail a test.

Commands (from the project root):
```powershell
docker build -t playwright-tests .
docker run --rm playwright-tests
```

If `docker` is not on your PowerShell PATH, use the installed CLI directly:
```powershell
$d = "C:\Users\Mohat Kumar\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe"
& $d build -t playwright-tests .
& $d run --rm playwright-tests
```

To keep the Allure JSON results on the host after the container exits:
```powershell
docker run --rm -v "${PWD}\allure-results:/app/allure-results" playwright-tests
npm run allure:generate
```
