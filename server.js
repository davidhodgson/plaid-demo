"use strict";

var util = require("util");

var envvar = require("envvar");
var express = require("express");
var bodyParser = require("body-parser");
var moment = require("moment");
const PlaidClient = require('./plaidClient');

var APP_PORT = envvar.number("APP_PORT", 8000);
var PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
var PLAID_SECRET = process.env.PLAID_SECRET;
var PLAID_ENV = process.env.PLAID_ENV;
// PLAID_PRODUCTS is a comma-separated list of products to use when initializing
// Link. Note that this list must contain 'assets' in order for the app to be
// able to create and retrieve asset reports.
var PLAID_PRODUCTS = process.env.PLAID_PRODUCTS.split(",");

// PLAID_PRODUCTS is a comma-separated list of countries for which users
// will be able to select institutions from.
var PLAID_COUNTRY_CODES = "US".split(",");

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:8000/oauth-response.html'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
var PLAID_REDIRECT_URI = envvar.string("PLAID_REDIRECT_URI", "");

// We store the access_token in memory - in production, store it in a secure
// persistent data store
var ACCESS_TOKEN = null;
var ITEM_ID = null;
// The payment_id is only relevant for the UK Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store
var PAYMENT_ID = null;

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)

/*
var client = new plaid.Client({
  clientID: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: plaid.environments[PLAID_ENV],
  options: {
    version: "2019-05-29"
  }
});
*/

const client = new PlaidClient();

var app = express();
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

app.get("/", function(request, response, next) {
  response.sendFile("./views/addAccount.html", { root: __dirname });
});

app.get("/summary", function(request, response, next) {
  response.sendFile("./views/summary.html", { root: __dirname });
});

app.get("/transactions", function(request, response, next) {
  response.sendFile("./views/transactions.html", { root: __dirname });
});

// This is an endpoint defined for the OAuth flow to redirect to.
app.get("/oauth-response.html", function(request, response, next) {
  response.sendFile("./views/oauth-response.html", { root: __dirname });
});

app.post("/api/info", function(request, response, next) {
  response.json({
    item_id: ITEM_ID,
    access_token: ACCESS_TOKEN,
    products: PLAID_PRODUCTS
  });
});

app.post("/api/create_link_token", async function(request, response, next) {
  const configs = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: "user-id"
    },
    client_name: "Plaid Quickstart",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en"
  };

  if (PLAID_REDIRECT_URI !== "") {
    configs.redirect_uri = PLAID_REDIRECT_URI;
  }

  let resp;
  try {
    resp = client.createLinkToken(configs);
    return response.json(resp);
  } catch (error) {
    console.log(error);
    return response.json({
      error: error
    });
  }
});

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post("/api/set_access_token", async function(request, response, next) {
  let resp;
  try {
    resp = await client.exchangePublicToken(request.body.public_token);

    ACCESS_TOKEN = resp.access_token;
    ITEM_ID = resp.item_id;
    console.log(resp);
    console.log("access token: ", ACCESS_TOKEN);
    console.log("item id: ", ITEM_ID);

    response.json({
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null
    });
  } catch (error) {
    console.log(error);
    return response.json({
      error: error
    });
  }
});

// Retrieve an Item's accounts
// https://plaid.com/docs/#accounts
app.get("/api/accounts", async function(request, response, next) {
  let accessTokens = JSON.parse(request.query.data);
  let access_tokens = accessTokens.access_tokens;

  let accountsResponses = [];

  for (let i = 0; i < access_tokens.length; i++) {
    let access_token = access_tokens[i];
    let accounts = await getAccounts(access_token);
    let institution = await getInstitution(access_token);
    let accountsData = { accounts, institution: institution.institution.name };
    accountsResponses.push(accountsData);
  }

  console.log("accountsResponses: ", accountsResponses);

  response.json(accountsResponses);
});

async function getAccounts(access_token) {
  let accountsResponse = await client.getAccounts(access_token);
  return accountsResponse;
}

async function getInstitution(access_token) {
  let item = await client.getItem(access_token);
  let institution = await client.getInstitutionById(item.item.institution_id);
  return institution;
}

async function getTransactions(access_token) {
  var startDate = moment()
    .subtract(7, "days")
    .format("YYYY-MM-DD");
  var endDate = moment().format("YYYY-MM-DD");

  let transactions;

  try {
    transactions = await client.getTransactions(
      access_token,
      startDate,
      endDate,
      {
        count: 250,
        offset: 0
      }
    );
  } catch (e) {
    console.log(e);
  }

  return transactions;
}

app.get("/api/transactions", async function(request, response, next) {
  let accessTokens = JSON.parse(request.query.data);
  let access_tokens = accessTokens.access_tokens;
  let transactionsList = [];

  for (let i = 0; i < access_tokens.length; i++) {
    let access_token = access_tokens[i];
    let transactions = await getTransactions(access_token);
    transactionsList.push(transactions);
  }

  response.json(transactionsList);
});

var server = app.listen(APP_PORT, function() {
  console.log("Server listening on port " + APP_PORT);
});

var prettyPrintResponse = response => {
  console.log(util.inspect(response, { colors: true, depth: 4 }));
};
