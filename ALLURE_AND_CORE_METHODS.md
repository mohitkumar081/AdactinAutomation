# Allure Reporting, Core Methods, Utilities & Hooks

Implemented as per **PART 04 (Allure Reporting)**, **PART 05 (Hooks in Playwright)** and **PART 06 (API Automation)** manuals.

## Final framework structure (manual Part 05, page 06)

```text
AdactinAutomation/
├── README.md                   # setup, execution, CI/CD and deliverables
├── docs/
│   ├── ARCHITECTURE.md         # Mermaid layer diagram + call flow
│   ├── architecture.svg        # same diagram as an image
│   └── evidence/               # successful Jenkins run screenshots
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
│   ├── waitutil.js             # Common wait utility used by BasePage
│   ├── testdata.js             # Fresh JSON loader + DATASET_INDEX selection
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
cd AdactinAutomation
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
- `utils/waitutil.js` — explicit/implicit-style waits, shared by `BasePage`.
- `utils/testdata.js` — re-reads JSON data and supports `DATASET_INDEX` for `validUsers[]`.
- `utils/config.js` — `APP_URL`, timeout constants.

### Hooks (setup & teardown)
`fixtures/testSetup.js`:
- `test.beforeAll()` / `test.afterAll()` — suite-level init and teardown markers.
- `base.extend({ pageSetup: [...] , { auto: true } })` opens `APP_URL` before every test.
- `test.afterEach()` attaches a lifecycle log plus final/failure screenshots.
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
  matches the Playwright version in `package-lock.json`), installs locked
  dependencies with `npm ci`, copies the framework, runs
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
docker build --load -t playwright-tests .
docker run --rm playwright-tests
```

If `docker` is not on your PATH, add the Docker Desktop `resources/bin` folder to the shell PATH first, then use the same commands.

To keep the Allure JSON results on the host after the container exits:
```powershell
docker run --rm -v "${PWD}\allure-results:/app/allure-results" playwright-tests
npm run allure:generate
```

## 10) Jenkins CI/CD (Part 08)
- `Jenkinsfile` is a **declarative pipeline**: checkout → `docker build` →
  `docker run` (all 16 UI + API specs) → copy `playwright-report`,
  `allure-results` and `test-results` out of the container → publish HTML +
  Allure reports and archive screenshots/videos/logs → `docker rm -f` in `post`.
- Triggers: `githubPush()` (GitHub webhook via ngrok) and `cron('H 3 * * *')`
  (nightly schedule).
- Required Jenkins plugins: Pipeline, Git, GitHub Integration, NodeJS,
  HTML Publisher, Allure Jenkins Plugin. Allure additionally needs a configured
  tool: name `Allure`, home = the global npm folder that contains `allure.cmd`.
  Because `allure.cmd` is a Node shim, the Node.js folder must also be on Jenkins'
  global PATH. See `JENKINS_SETUP.md` for the full one-time setup checklist.
- `jenkins-build.cmd` was verified locally with `%BUILD_NUMBER%=2`: image built
  and loaded with `--load`, **16 passed (3.1m)**, HTML report copied to
  `playwright-report/index.html` (1.25 MB), 613 Allure files archived, and the
  container removed. `docker build --load` matters when Docker uses the
  BuildKit/docker-container builder; without it the image stays only in cache
  and `docker run` fails with "Unable to find image".
- Jenkins runs as `LocalSystem`, where the buildx CLI plugin is missing. The
  first Jenkins build therefore rejected `--load` with `unknown flag`. The
  `Jenkinsfile` now tries `--load` and falls back to plain `docker build`, which
  loads the image into the local daemon with the legacy builder.
- Jenkins build #2 ran all **16 tests passed (4.0m)**. The build itself went red
  only because the Allure tool was not configured yet; that tool is now added,
  so the publish stage can finish on the next run.
