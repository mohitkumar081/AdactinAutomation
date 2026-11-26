# AdactinAutomation

Playwright (JavaScript) framework for the Adactin Hotel App, with API tests in the
same run, Allure evidence, and a Docker + Jenkins pipeline. Everything in this
folder runs as one suite of **16 tests**: 5 API, 1 end-to-end, 5 negative, 5 positive.

Application under test: <https://adactinhotelapp.com/>
API under test: <https://api-testing-postman.vercel.app/>

---

## What lives here

| Path | Purpose |
| --- | --- |
| `tests/positiveTests.spec.js` | 5 happy-path UI tests (TC-02 … TC-06). TC-02 is the login test. |
| `tests/negativeTests.spec.js` | 5 validation / unauthorised-access tests (TC-07 … TC-11). |
| `tests/endToEnd.spec.js` | 1 full booking flow (TC-01). |
| `tests/api.spec.js` | 5 API tests using Playwright's `request` fixture. |
| `pages/` | Page Objects. One class per page, plus `BasePage.js` for shared actions. |
| `fixtures/testSetup.js` | Hooks: suite setup/teardown, auto-navigation, per-test screenshots. |
| `utils/` | Screenshot, wait, API, config and test-data loaders. |
| `testdata/*.json` | Login, search, booking and API data — including schemas and expected responses. |
| `playwright.config.js` | Reporters, timeouts, Chromium project, CI worker/retry policy. |
| `Dockerfile` | Official Playwright image + locked npm install + browser dependencies. |
| `Jenkinsfile` | Declarative pipeline: checkout → build → run → publish → archive. |
| `docs/ARCHITECTURE.md` | Layer diagram and call flow. `docs/architecture.svg` is the same diagram as an image. |
| `docs/evidence/` | Screenshots from a successful Jenkins run. |

There is deliberately **no `login.spec.js`**. The manual's login example is already
covered by TC-02, and duplicating it would only add noise to the report.

---

## Architecture

The full diagram and the rules for each layer are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The short version:

```text
GitHub push / cron  →  Jenkinsfile  →  Docker image  →  Playwright
                                                          │
          JSON testdata ───────────────┬───────────────────┤
                                       ▼                   ▼
                              Page Objects + BasePage   API request fixture
                                       │                   │
                              utils (wait/screenshot)   utils/apiUtil
                                       └─────────┬─────────┘
                                                 ▼
                              HTML report + Allure + test-results
```

Specs keep the assertions. Page Objects keep the locators. Utilities keep anything
used twice. JSON keeps the values. Jenkins keeps the evidence.

---

## Run it on your machine

Prerequisites: Node.js 20+ with npm, Git, and Docker Desktop if you want the
container route. Jenkins is only needed for CI.

```powershell
cd "C:\Users\Mohat Kumar\Desktop\AdactinAutomation"

npm ci
npx playwright install --with-deps chromium   # skip if browsers are already installed

npm test                    # all 16 tests, Chromium
npm run test:api            # only the 5 API tests
```

Generate and open the Allure report:

```powershell
npm run allure:generate
npm run allure:open
```

Playwright also writes `playwright-report/index.html` by itself. Open that file
directly if you just want the HTML reporter.

### Switching login data

`utils/testdata.js` reads the JSON files from disk instead of relying on
`require()` caching. `loginData.json` contains a `validUsers` array. Index `0` is
the working shared account and is the default:

```powershell
$env:DATASET_INDEX = "1"    # use another entry from validUsers[]
npx playwright test --project=chromium
Remove-Item Env:\DATASET_INDEX
```

The suite still has 16 tests — only the dataset changes. API payloads use a
`{timestamp}` placeholder, resolved per request, so repeated runs do not collide.

---

## Docker

```powershell
docker build --load -t playwright-tests .
docker run --rm playwright-tests
```

The container executes `npx playwright test --project=chromium` with `CI=true`,
which gives one worker and two retries. Reports are written inside the container;
Jenkins copies them back out. To keep them locally:

```powershell
docker run --rm -v "${PWD}\allure-results:/app/allure-results" playwright-tests
npm run allure:generate
```

If your Docker CLI uses the legacy builder, `--load` is rejected with
`unknown flag: --load`. Use `docker build -t playwright-tests .` instead — the
legacy builder already loads the image into the local daemon. The `Jenkinsfile`
tries `--load` first and falls back automatically, so this only matters when you
build by hand.

---

## Jenkins / CI

One-time setup on this machine:

| Item | Value |
| --- | --- |
| Jenkins | <http://localhost:8080>, running as Windows service |
| Job | `automationjenkinsgit` — Pipeline, **Pipeline script from SCM** |
| Repository | `https://github.com/mohitkumar081/AdactinAutomation.git` |
| Credential | `github-playwright` (Username with password, GitHub PAT) |
| Branch | `*/main` |
| Script path | `Jenkinsfile` |
| Plugins | Git, GitHub, GitHub Integration, Pipeline, HTML Publisher, Allure |
| Global `PATH` | `C:\Users\Mohat Kumar\AppData\Local\Programs\DockerDesktop\resources\bin;%PATH%` |
| Allure tool | Name `Allure`, Home `C:\Users\Mohat Kumar\AppData\Roaming\npm` |
| Triggers | `githubPush()` and `cron('H 3 * * *')` |
| Webhook | `https://crawlers-tadpole-saffron.ngrok-free.dev/github-webhook/`, JSON, push only |

Full GUI instructions and troubleshooting are in [`JENKINS_SETUP.md`](JENKINS_SETUP.md).
Keep the ngrok tunnel running. A free ngrok URL changes on restart — update the
webhook URL when that happens, or use a static ngrok domain.

The pipeline publishes:

- **Playwright HTML Report** via HTML Publisher (`playwright-report/index.html`)
- **Allure Report** from `allure-results`
- Archived artifacts: HTML report, Allure JSON, screenshots, videos, traces and logs

Proof that push triggering works: commit `1383e15` was pushed, GitHub delivered the
`push` event with HTTP `200`, and Jenkins started a build without `Build Now`.

---

## Evidence

Screenshots of the successful Jenkins run are in [`docs/evidence/`](docs/evidence/).
The generated Allure and HTML reports also live in the Jenkins build's Artifacts
section, so they survive after the workspace is cleaned.

---

## Things that look odd but are intentional

- **E2E uses fixed dates** (`01/12/2025` → `02/12/2025`). The shared account's
  Booked Itinerary page is capped at roughly 1000 rows and sorted by arrival date;
  a far-future booking drops out of the visible list. The test still confirms the
  booking through the confirmation page and skips only the final itinerary screenshot.
- **Screenshot capture is best-effort.** A failed PNG never turns a passing test red.
  `utils/screenshotutil.js` retries once and attaches a text note if it still fails.
- **The public API sometimes returns a transient 500/HTML page.** `tests/api.spec.js`
  retries three times before asserting, and API tests run serially to avoid rate limits.
- **Tokens are never stored in the repo.** The GitHub PAT lives only in the Jenkins
  credential store. Do not paste it into a spec, a screenshot or chat.

---

## Quick deliverables map

- Source code: `pages/`, `tests/`, `fixtures/`, `utils/`, `testdata/`, `playwright.config.js`
- Documentation: this file, `docs/ARCHITECTURE.md`, `docs/architecture.svg`,
  `ALLURE_AND_CORE_METHODS.md`, `JENKINS_SETUP.md`
- Test report: generated by `npm run allure:generate` and by every Jenkins build
- CI/CD: `Dockerfile`, `.dockerignore`, `Jenkinsfile`, `jenkins-build.cmd`
- Pipeline proof: `docs/evidence/`
