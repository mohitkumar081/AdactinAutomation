const { test, expect } = require("@playwright/test");

const apiData = require("../testdata/apiData.json");
const {
  buildUrl,
  resolvePayload,
  validateSchema,
  assertStatus,
  assertContentType,
  assertResponseTime,
} = require("../utils/apiUtil");

const { endpoints, payloads, expected } = apiData;

function stamp() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function url(key) {
  return buildUrl(apiData.baseUrl, endpoints[key]);
}

function payload(key, value) {
  return resolvePayload(payloads[key], value);
}

function attachBody(name, body) {
  return test.info().attach(name, {
    body: JSON.stringify(body, null, 2),
    contentType: "application/json",
  });
}

async function send(request, method, key, data) {
  const options = data ? { data } : undefined;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const started = Date.now();
    const response = await request[method](url(key), options);
    const elapsed = Date.now() - started;
    const text = await response.text();
    const contentType = response.headers()["content-type"] || "";

    // The public test API occasionally returns a transient 500 / HTML error.
    if (
      response.status() >= 500 ||
      !contentType.includes(expected.headers.contentType)
    ) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw new Error(
        `${method.toUpperCase()} ${key} failed after ${maxAttempts} attempts: ` +
          `status ${response.status()}, body ${text.slice(0, 200)}`,
      );
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw new Error(`${key}: response was not valid JSON: ${error.message}`);
    }

    assertStatus(response, expected.status[key]);
    assertContentType(response, expected.headers.contentType);
    assertResponseTime(elapsed, expected.maxResponseTimeMs);
    validateSchema(body, expected.schemas[key]);

    await attachBody(`${method.toUpperCase()} ${key} - response body`, body);
    return { response, body, elapsed };
  }
}

// Each test creates its own user, so tests stay independent.
async function registerUser(request) {
  const value = stamp();
  const data = payload("register", value);
  const result = await send(request, "post", "register", data);
  expect(result.body.message).toBe(expected.messages.register);
  expect(result.body.success).toBe(true);
  return { value, data };
}

test.describe("API Automation - Playwright request fixture", () => {
  // Public demo API is rate-sensitive; run these independently but serially.
  test.describe.configure({ mode: "serial" });

  test("API-01: GET all users", async ({ request }) => {
    const result = await send(request, "get", "getAllUsers");
    expect(result.body.data.length).toBeGreaterThan(0);
    console.log(`GET completed in ${result.elapsed}ms`);
  });

  test("API-02: POST register user", async ({ request }) => {
    const result = await registerUser(request);
    console.log(`Registered user ${result.data.username}`);
  });

  test("API-03: POST login user", async ({ request }) => {
    const created = await registerUser(request);
    const result = await send(
      request,
      "post",
      "login",
      payload("login", created.value),
    );

    expect(result.body.message).toBe(expected.messages.login);
    expect(result.body.success).toBe(true);
    expect(result.body.data.accessToken).not.toBe("");
    console.log(`Login completed in ${result.elapsed}ms`);
  });

  test("API-04: PUT replace account", async ({ request }) => {
    const created = await registerUser(request);
    await send(request, "post", "login", payload("login", created.value));

    const result = await send(
      request,
      "put",
      "replaceAccount",
      payload("replaceAccount", created.value),
    );

    expect(result.body.message).toBe(expected.messages.replaceAccount);
    expect(result.body.success).toBe(true);
    expect(result.body.data.fullname).toBe("Updated User");
  });

  test("API-05: DELETE account", async ({ request }) => {
    const created = await registerUser(request);
    await send(request, "post", "login", payload("login", created.value));

    const result = await send(request, "delete", "deleteAccount");

    expect(result.body.message).toBe(expected.messages.deleteAccount);
    expect(result.body.success).toBe(true);
  });
});
