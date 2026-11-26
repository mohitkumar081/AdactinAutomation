@echo off
REM PART 08: paste these lines into Jenkins -> Build Steps ->
REM "Execute Windows batch command". Jenkins supplies %BUILD_NUMBER%.
setlocal enabledelayedexpansion
echo ========================================
echo                PLAYWRIGHT DOCKER CI/CD
echo ========================================
set IMAGE_NAME=playwright-tests:jenkins-test
set CONTAINER_NAME=playwright-tests-jenkins-%BUILD_NUMBER%
echo.
echo [1/4] Building Docker image...
docker build -t %IMAGE_NAME% .
if errorlevel 1 (
    echo Docker build FAILED
    exit /b 1
)
echo.
echo [2/4] Running Playwright tests in container...
REM No --rm: the stopped container is needed for docker cp below.
docker run --name %CONTAINER_NAME% %IMAGE_NAME%
set TEST_EXIT_CODE=%errorlevel%
echo.
echo [3/4] Copying the HTML report out of the container...
docker cp %CONTAINER_NAME%:/app/playwright-report ./playwright-report
REM Keep the Allure JSON results in the Jenkins workspace as extra evidence.
docker cp %CONTAINER_NAME%:/app/allure-results ./allure-results >nul 2>&1
echo.
echo [4/4] Removing the finished container...
docker rm %CONTAINER_NAME% >nul 2>&1
if %TEST_EXIT_CODE% NEQ 0 (
    echo ========================================
    echo                PLAYWRIGHT TESTS FAILED
    echo ========================================
    exit /b 1
)
echo ========================================
echo                PLAYWRIGHT TESTS PASSED
echo ========================================
