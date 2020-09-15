const PlaidClient = require("../plaidClient");
var sinon = require('sinon');
var expect = require('chai').expect;

describe("PlaidClient", function() {
  
  it("should create a new PlaidClient", function() {
    const plaidClient = new PlaidClient();
    expect(plaidClient).to.not.be.null;
  });
  
  it("should create a createLinkToken", function() {
    const plaidClient = new PlaidClient();
    sinon.stub(plaidClient, "createLinkToken").returns("token");
    
    let linkToken = plaidClient.createLinkToken({});
    expect(linkToken).to.eql("token");
  });
  
  it("should exchange a public token for an access token", function() {
    const plaidClient = new PlaidClient();
    sinon.stub(plaidClient, "exchangePublicToken");
    
    let access_token = plaidClient.exchangePublicToken("public_token");
     
    
  });
  
});