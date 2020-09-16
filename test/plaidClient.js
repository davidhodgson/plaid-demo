const { PlaidClientWrapper, MockPlaidClient } = require("../plaidClient");
var expect = require('chai').expect;

describe("PlaidClient", function() {
  
  const mockPlaidClient = new MockPlaidClient();
  const plaidClient = new PlaidClientWrapper(mockPlaidClient);
  
  it("should create a createLinkToken", function() {
    let linkToken = plaidClient.createLinkToken({});
    expect(linkToken).to.eql('link-token');
  });
  
  it("should exchange a public token for an access token", function() {
    let resp = plaidClient.exchangePublicToken("public_token");
    expect(resp.access_token).to.eql("access-token"); 
  });
  
  it("should get account data, given an access token", function() {
    let account_data = plaidClient.getAccounts("access_token");
    expect(account_data).to.eql("list-of-accounts");
  });
  
  it("should get an institution, given an access token", async function() {
    let institution = await plaidClient.getInstitution("access_token");
    let expected = { institution: { name: "institution-name"}};

    expect(institution).to.eql(expected);
  });
  
  it("should get recent transaction data, given an access token", async function() {
    let transactions_list = await plaidClient.getTransactions("access_token");
    expect(transactions_list).to.eql("transactions-list");
  });
  
});