@echo off
setlocal enabledelayedexpansion
echo ========================================
echo                PLAYWRIGHT DOCKER CI/CD
echo ========================================
set IMAGE_NAME=playwright-tests:jenkins-test
set CONTAINER_NAME=playwright-tests-jenkins-%BUILD_NUMBER%
echo.
echo [1/4] Building Docker image...
docker build --load -t %IMAGE_NAME% .
if errorlevel 1 (
    echo Docker build FAILED
    exit /b 1
)
echo.
echo [2/4] Running Playwright tests in container...
docker run --name %CONTAINER_NAME% %IMAGE_NAME%
set TEST_EXIT_CODE=%errorlevel%
echo.
echo [3/4] Copying the HTML report out of the container...
docker cp %CONTAINER_NAME%:/app/playwright-report ./playwright-report
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
