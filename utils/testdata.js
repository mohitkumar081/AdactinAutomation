const fs = require("fs");
const path = require("path");

function load(name) {
  const file = path.join(__dirname, "..", "testdata", `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

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
