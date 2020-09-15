var plaid = require("plaid");
var moment = require("moment");

var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_ENV = process.env.PLAID_ENV;

class PlaidClient {
  constructor() {
    this.client = new plaid.Client({
      clientID: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      env: plaid.environments[PLAID_ENV],
      options: {
        version: "2019-05-29"
      }
    });
  }

  createLinkToken(configs) {
    return this.client.createLinkToken(configs);
  }

  exchangePublicToken(public_token) {
    return this.client.exchangePublicToken(public_token);
  }

  getAccounts(access_token) {
    return this.client.getAccounts(access_token);
  }

  async getInstitution(access_token) {
    let item = await this.client.getItem(access_token);
    let institution = await this.client.getInstitutionById(
      item.item.institution_id
    );
    return institution;
  }
  
  async getTransactions(access_token) {
    var startDate = moment()
    .subtract(7, "days")
    .format("YYYY-MM-DD");
  var endDate = moment().format("YYYY-MM-DD");

  let transactions;

  try {
    transactions = await this.client.getTransactions(
      access_token,
      startDate,
      endDate,
      {
        count: 250,
        offset: 0
      }
    );
  } catch (error) {
    console.log(error);
    throw(error);
  }

  return transactions;
  }
}

module.exports = PlaidClient;
