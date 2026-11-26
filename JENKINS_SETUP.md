# Jenkins + Docker CI/CD setup (this machine)

This is the live configuration for `automationjenkinsgit`. Tokens are never in this
file or in Git — the GitHub PAT lives only in the Jenkins credential store.

## Current state

| Item | Value |
| --- | --- |
| Jenkins | 2.580.3, installed via MSI, service `Jenkins` = Running / Automatic |
| URL | <http://localhost:8080> |
| Java home used by installer | `C:\Users\Mohat Kumar\Downloads\jdk-21\jdk-21.0.13.1+2` |
| Jenkins home | `C:\ProgramData\Jenkins\.jenkins` |
| Repository | `https://github.com/mohitkumar081/AdactinAutomation.git` |
| Branch | `*/main` |
| Job | `automationjenkinsgit` — Pipeline script from SCM, script path `Jenkinsfile` |
| Credential ID | `github-playwright` — Username with password, username `mohitkumar081` |
| Plugins | Git, GitHub, GitHub Integration, Pipeline, HTML Publisher, Allure Jenkins Plugin, NodeJS |
| Global `PATH` | `C:\Users\Mohat Kumar\AppData\Local\Programs\DockerDesktop\resources\bin;%PATH%` |
| Allure tool | Name `Allure`, Home `C:\Users\Mohat Kumar\AppData\Roaming\npm` |
| ngrok | `C:\Users\Mohat Kumar\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe`, config valid |
| Tunnel script | `D:\Docker\ngrok-tunnel.cmd` |
| Webhook | `https://crawlers-tadpole-saffron.ngrok-free.dev/github-webhook/`, JSON, push only |
| Trigger | `githubPush()` + `cron('H 3 * * *')` |

GitHub webhook delivery for commit `1383e15` returned **HTTP 200**, and the
following Jenkins build started without clicking **Build Now**. That is the push
trigger proof.

## Job configuration to keep

| Section | Value |
| --- | --- |
| Pipeline definition | Pipeline script from SCM |
| SCM | Git |
| Repository URL | `https://github.com/mohitkumar081/AdactinAutomation.git` |
| Credentials | `github-playwright` |
| Branches to build | `*/main` |
| Script path | `Jenkinsfile` |

`jenkins-build.cmd` stays in the repo only as the Freestyle/manual reference.
The Pipeline job reads `Jenkinsfile` from GitHub and does not use that `.cmd`.

## What the pipeline does

1. `checkout scm` pulls `main`.
2. Builds `playwright-tests:jenkins-$BUILD_NUMBER`.
3. Runs the container: all 16 UI + API tests on Chromium.
4. Copies `playwright-report`, `allure-results` and `test-results` out of the stopped container.
5. Archives artifacts, publishes the Playwright HTML report and the Allure report.
6. Removes the container in `post { always }`.

Successful-run screenshots are committed under [`docs/evidence/`](docs/evidence/).

## Docker quirk on this machine

Jenkins runs as `LocalSystem`, which has no `docker-buildx` CLI plugin. Docker
therefore falls back to the legacy builder and rejects `--load`:

```text
DEPRECATED: The legacy builder is deprecated ...
unknown flag: --load
```

The `Jenkinsfile` handles it: it tries `docker build --load ...` first, then
retries with plain `docker build ...`. The legacy builder loads the image into
the local daemon by default. On a shell where buildx is present, `--load` is
still the right flag because the BuildKit/docker-container builder otherwise
leaves the image only in cache and `docker run` says
`Unable to find image '...' locally`.

## ngrok note

The free ngrok URL changes whenever the tunnel restarts. When
`D:\Docker\ngrok-tunnel.cmd` is restarted, copy the new `https://...ngrok-free.dev`
URL into GitHub → Settings → Webhooks → Payload URL, keeping the trailing
`/github-webhook/`. A static ngrok domain avoids this step.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Jenkins console `403` before login | Expected. Log in, or use the Jenkins API token for automation. |
| `No Allure installation found` | Manage Jenkins → Tools → Allure; name `Allure`, home `C:\Users\Mohat Kumar\AppData\Roaming\npm`. |
| `unknown flag: --load` | Legacy Docker builder. Do not panic; the `Jenkinsfile` retries without the flag. |
| `Unable to find image ... locally` | BuildKit kept the image in cache only. Add `--load` when your CLI supports it. |
| Webhook not triggering | Check the tunnel is online and the payload URL still matches the current ngrok URL. Recent Deliveries must show `200`. |
| E2E cannot find today's booking | Known shared-account limit; TC-01 uses fixed early dates for that reason. |

## Security

- Never put the GitHub PAT, Jenkins API token or ngrok token in a file under this repo.
- Do not paste tokens into chat, console logs or screenshots.
- `node_modules`, generated reports and the nested duplicate folder stay out of Git.
