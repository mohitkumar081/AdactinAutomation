FROM mcr.microsoft.com/playwright:v1.65.0-jammy

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npx playwright install --with-deps

COPY . .

ENV CI=true

CMD ["npx", "playwright", "test", "--project=chromium"]
