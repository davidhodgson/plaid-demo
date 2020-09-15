var expect = require('chai').expect;
const PlaidClient = require("../plaidClient");

describe("PlaidClient", function() {
  
  it("should create a new PlaidClient", function() {
    const plaidClient = new PlaidClient();
    expect(plaidClient).to.not.be.null;
  });
  
  it("should test createLinkToken", function() {
    const plaidClient = new PlaidClient();
    let linkToken = plaidClient.createLinkToken({});
  });
  
});