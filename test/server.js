var expect = require("chai").expect;
const request = require("supertest");
var app = require("../server");

describe("API tests", function() {
  it("should test /api/create_link_token", async function() {
    const resp = await request(app).post("/api/create_link_token");
    expect(resp.body).to.eql('link-token');
  });

  it("should test /api/set_access_token", async function() {
    const resp = await request(app).post('/api/set_access_token');
    expect(resp.body.access_token).to.eql('access-token');
  });

  it("should test /api/accounts", async function() {
    const resp = await request(app).get('/api/accounts?data={"access_tokens":["access-sandbox-token1","access-sandbox-token2"]}');
    let account = { accounts: "list-of-accounts", institution: 'institution-name'};
    expect(resp.body[0]).to.eql(account);
  });

  it("should test /api/transactions", async function() {
    const resp = await request(app).get('/api/transactions?data={"access_tokens":["access-sandbox-token1","access-sandbox-token2"]}');
    expect(resp.body[0]).to.eql('transactions-list');
  });

});
