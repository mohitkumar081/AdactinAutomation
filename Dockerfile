# PART 07: CI/CD Pipeline (Jenkins & Docker)
# Official Playwright image; tag matches the version pinned in package-lock.json (1.65.0).
FROM mcr.microsoft.com/playwright:v1.65.0-jammy

# Create app directory
WORKDIR /app

# Copy package files first so the dependency layer can be cached
COPY package*.json ./

# Install exact locked versions (PART 08 requires npm ci + package-lock.json)
RUN npm ci

# Install Playwright browsers with OS dependencies (as per PART 07 manual).
# Keep this before COPY . . so source changes reuse the cached dependency layer.
RUN npx playwright install --with-deps

# Copy all project files (tests, fixtures, pages, utils, testdata, config)
COPY . .

# CI mode in playwright.config.js => 1 worker + retries for the shared demo site/API
ENV CI=true

# Run the verified Chromium suite (same project as `npm test`)
CMD ["npx", "playwright", "test", "--project=chromium"]
