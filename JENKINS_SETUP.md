# PART 08 — Jenkins + Docker CI/CD Setup (this machine)

## Already done locally

| Item | Detail |
| --- | --- |
| Git repo | Initialised on branch `main`, initial commit `e218d17` |
| `.gitignore` | `node_modules`, `playwright-report`, `test-results`, `allure-results`, `allure-report`, `.vscode`, nested duplicate folder |
| `.dockerignore` | Build junk excluded (incl. nested duplicate, `*.md`) |
| `Dockerfile` | Image `v1.65.0-jammy`, `npm ci`, `ENV CI=true`, Chromium suite |
| `playwright.config.js` | `list` + **HTML report in `playwright-report`** + Allure |
| `jenkins-build.cmd` | Jenkins batch step: build → run → copy HTML report → remove container |
| Jenkins MSI | Copied to `D:\Docker\jenkins.msi` (original in Downloads untouched) |
| Jenkins install script | `D:\Docker\install-jenkins.cmd` (installs to `D:\Jenkins`, `JENKINS_HOME=D:\Jenkins\home`) |
| ngrok | Extracted at `C:\Users\Mohat Kumar\Downloads\ngrok-v3-stable-windows-amd64` (v3.39.13) |
| ngrok tunnel script | `D:\Docker\ngrok-tunnel.cmd` |

## What YOU need to do (in order)

### 1. Install Jenkins (needs admin)
Right-click **`D:\Docker\install-jenkins.cmd`** → **Run as administrator** → UAC me **Yes**.
- Jenkins URL: http://localhost:8080
- Initial password: `D:\Jenkins\secrets\initialAdminPassword`
- Install suggested plugins, create first admin user, keep URL `http://localhost:8080/`.
- If service not running: Windows **Services** → `Jenkins` → Start.

### 2. Create GitHub token (do NOT paste it in chat/AI)
GitHub → profile → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token:
- Token name: `Jenkins-Playwright`
- Expiration: 90 days
- Resource owner: your account
- Repository access: **Only select repositories** → this repo
- Repository permissions: **Contents: Read-only**
Copy token once and paste it directly into Jenkins credential (next section).

### 3. Create empty GitHub repository
On GitHub create a **new empty repo** (no README / .gitignore). Copy its HTTPS URL. Then in VS Code terminal:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### 4. Jenkins plugins
Manage Jenkins → Plugins → Available: install **Git**, **GitHub**, **GitHub Integration**, **NodeJS**, **Pipeline**, **HTML Publisher**, **Allure Jenkins Plugin**. Restart Jenkins if asked.

### 5. Jenkins global settings
- **Manage Jenkins → System → Global properties → Environment variables → Add**
  - Name `PATH`
  - Value `C:\Users\Mohat Kumar\AppData\Local\Programs\DockerDesktop\resources\bin;%PATH%`
- **Manage Jenkins → Tools → NodeJS installations → Add NodeJS**
  - Name exactly `NodeJS`, Install automatically = checked, Version = current LTS.
- **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**
  - Kind: `Username with password`
  - Username: your GitHub username
  - Password: the fine-grained token from step 2
  - ID: `github-playwright`

### 6. Pipeline job (uses the committed `Jenkinsfile`)
New Item → name **`automationjenkinsgit`** → **Pipeline**. Configure:

| Section | Value |
| --- | --- |
| Pipeline definition | **Pipeline script from SCM** |
| SCM | Git |
| Repository URL | your HTTPS repo URL |
| Credentials | `github-playwright` |
| Branches to build | `*/main` |
| Script path | `Jenkinsfile` (default) |

Save → click **Build Now** once. This first run loads the triggers from `Jenkinsfile`:

- `githubPush()` → GitHub webhook (step 7) starts a build on every push
- `cron('H 3 * * *')` → nightly scheduled build (~03:00)

Console Output must end with `PLAYWRIGHT TESTS PASSED` / `Finished: SUCCESS`. The build page will show **Playwright HTML Report**, **Allure Report**, and archived screenshots/videos under **Build Artifacts**.

> `jenkins-build.cmd` in the repo is kept only as the Freestyle/manual reference script; the Pipeline job does **not** need it.

### 7. ngrok + GitHub webhook (auto trigger)
One time, in the ngrok folder:
```powershell
ngrok config add-authtoken YOUR_TOKEN
```
Then run **`D:\Docker\ngrok-tunnel.cmd`** and keep the window open. Copy its `https://...ngrok-free.app` forwarding URL.

GitHub repo → Settings → Webhooks → Add webhook:
- Payload URL: `https://<your-url>/github-webhook/` (**trailing slash required**)
- Content type: `application/json`
- Events: Just the push event
- Active: ☑

Recent Deliveries must show a green check / `200`.

> Free ngrok URLs change on every restart. Each time you restart the tunnel, update the webhook Payload URL. A static free domain from the ngrok dashboard avoids this.

### 8. Prove the automatic pipeline
Make a small visible change in VS Code, then:
```powershell
git add .
git commit -m "Verify automatic Jenkins trigger"
git push origin main
```
**Do not click Build Now.** A new Jenkins build should appear by itself, console shows `Started by GitHub push by <user>`, `16 passed`, and the HTML report tab shows the run.

## Security reminders
- Never paste the GitHub token / ngrok token into chat, screenshots or commits.
- No test should `console.log` full auth responses/tokens — Jenkins stores console output in plain text.
- `node_modules` stays out of Git and out of the Docker build context.

## Troubleshooting
- If the console says `Unable to find image 'playwright-tests:...' locally` right
  after a successful build, Docker used the BuildKit container builder and kept
  the result only in cache. Both `jenkins-build.cmd` and `Jenkinsfile` already use
  `docker build --load` to load the image into the local daemon before `docker run`.

## Daily checklist
- Docker Desktop whale icon steady (engine up)
- http://localhost:8080 reachable
- ngrok window open + online, webhook URL matches current tunnel URL
