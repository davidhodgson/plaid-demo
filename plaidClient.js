var plaid = require("plaid");

var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_ENV = process.env.PLAID_ENV;

class PlaidClient {
  constructor() {
    console.log("creating plaid client");
    this.client = new plaid.Client({
      clientID: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      env: plaid.environments[PLAID_ENV],
      options: {
        version: "2019-05-29"
      }
    });
  }
  
  createLinkToken() {
    
  }
}

module.exports = PlaidClient;