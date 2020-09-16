"use strict";

var envvar = require("envvar");
var express = require("express");
var bodyParser = require("body-parser");

const { MockPlaidClient, PlaidClientWrapper, RealPlaidClient } = require("./plaidClient");

var PLAID_PRODUCTS = ["transactions"];
var PLAID_COUNTRY_CODES = ["US"];

// Parameters used for the OAuth redirect Link flow.
//
// Set PLAID_REDIRECT_URI to 'http://localhost:8000/oauth-response.html'
// The OAuth redirect flow requires an endpoint on the developer's website
// that the bank website should redirect to. You will need to configure
// this redirect URI for your client ID through the Plaid developer dashboard
// at https://dashboard.plaid.com/team/api.
var PLAID_REDIRECT_URI = envvar.string("PLAID_REDIRECT_URI", "");
let client;
let APP_PORT;
if (process.env.TESTING) {
  let mockPlaidClient = new MockPlaidClient();
  client = new PlaidClientWrapper(mockPlaidClient);
  APP_PORT = 8001;
} else {
  let realPlaidClient = new RealPlaidClient();
  client = new PlaidClientWrapper(realPlaidClient);
  APP_PORT = 8000;
}

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
    item_id: "item_id",
    access_token: "access_token",
    products: PLAID_PRODUCTS
  });
});

// create a link token
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
    resp = await client.createLinkToken(configs);
    return response.json(resp);
  } catch (error) {
    console.log(error);
    return response.json({
      error: error
    });
  }
});

// Exchange public token for an access token
app.post("/api/set_access_token", async function(request, response, next) {
  let resp;
  try {
    resp = await client.exchangePublicToken(request.body.public_token);

    response.json({
      access_token: resp.access_token,
      item_id: resp.item_id,
      error: null
    });
  } catch (error) {
    console.log(error);
    return response.json({
      error: error
    });
  }
});

// Returns a list of accounts, given a list of access_tokens
app.get("/api/accounts", async function(request, response, next) {
  
  let accessTokens = JSON.parse(request.query.data);
  let access_tokens = accessTokens.access_tokens;

  let accountsList = [];

  try {
    for (let i = 0; i < access_tokens.length; i++) {
      let access_token = access_tokens[i];
      let accounts = await client.getAccounts(access_token);
      let institution = await client.getInstitution(access_token);

      let accountsData = {
        accounts,
        institution: institution.institution.name
      };

      accountsList.push(accountsData);
    }
  } catch (error) {
    console.log(error);
    response.json({ error });
  }

  response.json(accountsList);
});

// Returns a list of transactions, given a list of access_tokens
app.get("/api/transactions", async function(request, response, next) {
  let accessTokens = JSON.parse(request.query.data);
  let access_tokens = accessTokens.access_tokens;

  let transactionsList = [];

  if (!access_tokens) {
    response.json({error: "no access_tokens"});
  }

  try {
    for (let i = 0; i < access_tokens.length; i++) {
      let access_token = access_tokens[i];
      let transactions = await client.getTransactions(access_token);
      console.log(transactions);
      transactionsList.push(transactions);
    }
  } catch (error) {
    console.log(error);
    response.json({ error });
  }

  response.json(transactionsList);
});

var server = app.listen(APP_PORT, function() {
  console.log("Server listening on port " + APP_PORT);
});

module.exports = app;