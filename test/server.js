var expect = require("chai").expect;
const request = require("supertest");
var app = require("../server");

describe.only("API tests", function() {
  it("should test /api/create_link_token", async function() {
    const resp = await request(app).post("/api/create_link_token");
    expect(resp.body).to.eql('link-token');
  });

  it("should test /api/set_access_token", async function() {
    const resp = await request(app).post('/api/set_access_token');
    expect(resp.body.access_token).to.eql('access-token');
  });

  it.only("should test /api/accounts", async function() {
    let tokens = ['token1', 'token2'];
    const resp = await request(app).get('/api/transactions').query({data: tokens});
    expect(resp.body).to.eql('test');
  });

});
