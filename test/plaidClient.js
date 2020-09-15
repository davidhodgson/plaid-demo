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
    sinon.stub(plaidClient, "exchangePublicToken").returns("access_token");
    
    let access_token = plaidClient.exchangePublicToken("public_token");
    expect(access_token).to.eql("access_token"); 
    
  });
  
  it("should get account data, given an access token", function() {
    const plaidClient = new PlaidClient();
    sinon.stub(plaidClient, "getAccounts").returns("account_data");
    
    let account_data = plaidClient.getAccounts("access_token");
    expect(account_data).to.eql("account_data");
  });
  
  it("should get an institution, given an access token", function() {
    const plaidClient = new PlaidClient();
    sinon.stub(plaidClient, "getInstitution").returns("institution_data");
    
    let institution = plaidClient.getInstitution("access_token");
    expect(institution).to.eql("institution_data");
    
  });
  
  it("should get recent transaction data, given an access token", function() {
    
  });
  
});