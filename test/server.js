var expect = require("chai").expect;
const nock = require("nock");
const request = require("superagent");
var app = require("../server");

describe("test", function() {
  it("should run a test", function() {
    expect(true).to.be.true;
  });

  it("should test /api/create_link_token", async function() {
    const resp = await request(app).post("/api/create_link_token");
    expect(resp).to.not.be.null;
  });
});
