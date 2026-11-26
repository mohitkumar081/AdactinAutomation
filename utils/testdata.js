// Fresh JSON test-data loader. require() caches modules, so specs use this when
// a value needs to be picked at runtime rather than frozen at module load.

const fs = require("fs");
const path = require("path");

function load(name) {
  const file = path.join(__dirname, "..", "testdata", `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Returns a login dataset from loginData.json.
 * DATASET_INDEX lets the same 16 tests run against another valid user without
 * editing a spec:  DATASET_INDEX=1 npx playwright test
 */
function loginUser() {
  const data = load("loginData");
  const users = Array.isArray(data.validUsers) && data.validUsers.length
    ? data.validUsers
    : [data.validUser];
  const index = Number(process.env.DATASET_INDEX || 0);
  const picked = users[Math.abs(Math.trunc(index)) % users.length];
  return {
    username: picked.username,
    password: picked.password,
    ExpectedMsg: picked.ExpectedMsg || "",
  };
}

module.exports = { load, loginUser };
