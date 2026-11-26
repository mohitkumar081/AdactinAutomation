function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function resolvePayload(template, stamp) {
  return JSON.parse(JSON.stringify(template).replace(/\{timestamp\}/g, stamp));
}

function buildUrl(baseUrl, endpoint) {
  return `${baseUrl.replace(/\/$/, "")}${endpoint}`;
}

function validateSchema(value, schema, path = "body") {
  if (schema.type) {
    const actual = typeOf(value);
    if (schema.type === "number") {
      if (actual !== "number") {
        throw new Error(`${path}: expected number, got ${actual}`);
      }
    } else if (actual !== schema.type) {
      throw new Error(`${path}: expected ${schema.type}, got ${actual}`);
    }
  }

  if (schema.required && typeOf(value) === "object") {
    for (const key of schema.required) {
      if (!(key in value)) {
        throw new Error(`${path}.${key}: required field is missing`);
      }
    }
  }

  if (schema.properties && typeOf(value) === "object") {
    for (const [key, subSchema] of Object.entries(schema.properties)) {
      if (key in value) {
        validateSchema(value[key], subSchema, `${path}.${key}`);
      }
    }
  }

  if (schema.items && typeOf(value) === "array") {
    value.forEach((item, index) => {
      validateSchema(item, schema.items, `${path}[${index}]`);
    });
  }
}

function assertStatus(response, expectedStatus) {
  if (response.status() !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status()}`,
    );
  }
}

function assertContentType(response, expectedContentType) {
  const contentType = response.headers()["content-type"] || "";
  if (!contentType.includes(expectedContentType)) {
    throw new Error(
      `Expected content-type to contain "${expectedContentType}", got "${contentType}"`,
    );
  }
}

function assertResponseTime(elapsedMs, maxMs) {
  if (elapsedMs > maxMs) {
    throw new Error(`Response time ${elapsedMs}ms exceeded ${maxMs}ms`);
  }
}

module.exports = {
  buildUrl,
  resolvePayload,
  validateSchema,
  assertStatus,
  assertContentType,
  assertResponseTime,
};
