var plaid = require("plaid");
var moment = require("moment");

var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_ENV = process.env.PLAID_ENV;

class RealPlaidClient {
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

  async getAccounts(access_token) {
    return await this.client.getAccounts(access_token);
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
      return transactions;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

class MockPlaidClient {
  createLinkToken(configs) {
    return "link-token";
  }

  exchangePublicToken(public_token) {
    return { access_token: "access-token", item_id: "item-id" };
  }

  getAccounts(access_token) {
    return "list-of-accounts";
  }

  async getItem(access_token) {
    return {
      item: {
        institution_id: "institution-id"
      }
    };
  }

  async getInstitution(access_token) {
    return {institution: {name: 'institution-name'}};
  }

  async getInstitutionById(id) {
    return "institution-name";
  }

  async getTransactions(access_token) {
    return "transactions-list";
  }
}

class PlaidClientWrapper {
  constructor(client) {
    this.client = client;
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
    return this.client.getInstitution(access_token);
  }

  async getTransactions(access_token) {
    return await this.client.getTransactions(access_token);
  }
}

module.exports = { PlaidClientWrapper, RealPlaidClient, MockPlaidClient };
