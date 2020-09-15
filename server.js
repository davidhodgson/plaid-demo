"use strict";

var util = require("util");

var envvar = require("envvar");
var express = require("express");
var bodyParser = require("body-parser");
var moment = require("moment");
var plaid = require("plaid");

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
var PUBLIC_TOKEN = null;
var ITEM_ID = null;
// The payment_id is only relevant for the UK Payment Initiation product.
// We store the payment_id in memory - in production, store it in a secure
// persistent data store
var PAYMENT_ID = null;

// Initialize the Plaid client
// Find your API keys in the Dashboard (https://dashboard.plaid.com/account/keys)
var client = new plaid.Client({
  clientID: PLAID_CLIENT_ID,
  secret: PLAID_SECRET,
  env: plaid.environments[PLAID_ENV],
  options: {
    version: "2019-05-29"
  }
});

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

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
// See https://plaid.com/docs/#create-link-token
app.post("/api/create_link_token", function(request, response, next) {
  console.log("creating link token");
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

  client.createLinkToken(configs, function(error, createTokenResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    console.log("createTokenResponse: ", createTokenResponse);
    response.json(createTokenResponse);
  });
});

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
// See https://plaid.com/docs/#payment-initiation-create-link-token-request
app.post("/api/create_link_token_for_payment", function(
  request,
  response,
  next
) {
  client.createPaymentRecipient(
    "Harry Potter",
    "GB33BUKB20201555555555",
    {
      street: ["4 Privet Drive"],
      city: "Little Whinging",
      postal_code: "11111",
      country: "GB"
    },
    function(error, createRecipientResponse) {
      var recipientId = createRecipientResponse.recipient_id;

      client.createPayment(
        recipientId,
        "payment_ref",
        {
          value: 12.34,
          currency: "GBP"
        },
        function(error, createPaymentResponse) {
          prettyPrintResponse(createPaymentResponse);
          var paymentId = createPaymentResponse.payment_id;
          PAYMENT_ID = paymentId;
          const configs = {
            user: {
              // This should correspond to a unique id for the current user.
              client_user_id: "user-id"
            },
            client_name: "Plaid Quickstart",
            products: PLAID_PRODUCTS,
            country_codes: PLAID_COUNTRY_CODES,
            language: "en",
            payment_initiation: {
              payment_id: paymentId
            }
          };
          if (PLAID_REDIRECT_URI !== "") {
            configs.redirect_uri = PLAID_REDIRECT_URI;
          }
          client.createLinkToken(
            {
              user: {
                // This should correspond to a unique id for the current user.
                client_user_id: "user-id"
              },
              client_name: "Plaid Quickstart",
              products: PLAID_PRODUCTS,
              country_codes: PLAID_COUNTRY_CODES,
              language: "en",
              redirect_uri: PLAID_REDIRECT_URI,
              payment_initiation: {
                payment_id: paymentId
              }
            },
            function(error, createTokenResponse) {
              if (error != null) {
                prettyPrintResponse(error);
                return response.json({
                  error: error
                });
              }
              response.json(createTokenResponse);
            }
          );
        }
      );
    }
  );
});

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post("/api/set_access_token", function(request, response, next) {
  console.log("setting access token: ", request.body.public_token);
  PUBLIC_TOKEN = request.body.public_token;
  client.exchangePublicToken(PUBLIC_TOKEN, function(error, tokenResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;
    prettyPrintResponse(tokenResponse);

    console.log("access token: ", ACCESS_TOKEN);
    console.log("item id: ", ITEM_ID);

    response.json({
      access_token: ACCESS_TOKEN,
      item_id: ITEM_ID,
      error: null
    });
  });
});

// Retrieve an Item's accounts
// https://plaid.com/docs/#accounts
app.get("/api/accounts", async function(request, response, next) {
  let accessTokens = JSON.parse(request.query.data);
  console.log("accessTokens: ", accessTokens);
  let access_tokens = accessTokens.access_tokens;
  console.log("access_tokens: ", access_tokens);

  let accountsResponses = [];

  for (let i = 0; i < access_tokens.length; i++) {
    let access_token = access_tokens[i];
    let accounts = await getAccounts(access_token);
    let institution = await getInstitution(access_token);
    console.log("accounts: ", accounts);
    console.log("institution: ", institution);
    console.log("institution name: ", institution.institution.name);
    let accountsData = { accounts, institution: institution.institution.name};
      // prettyPrintResponse(accountsResponse);
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
    .subtract(30, "days")
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
      },
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


/*
app.get("/api/transactions", function(request, response, next) {
  // Pull transactions for the Item for the last 30 days
  var startDate = moment()
    .subtract(30, "days")
    .format("YYYY-MM-DD");
  var endDate = moment().format("YYYY-MM-DD");
  client.getTransactions(
    ACCESS_TOKEN,
    startDate,
    endDate,
    {
      count: 250,
      offset: 0
    },
    function(error, transactionsResponse) {
      if (error != null) {
        prettyPrintResponse(error);
        return response.json({
          error: error
        });
      } else {
        prettyPrintResponse(transactionsResponse);
        response.json(transactionsResponse);
      }
    }
  );
});
*/

// Retrieve Identity for an Item
// https://plaid.com/docs/#identity
app.get("/api/identity", function(request, response, next) {
  client.getIdentity(ACCESS_TOKEN, function(error, identityResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    prettyPrintResponse(identityResponse);
    response.json({ identity: identityResponse.accounts });
  });
});

// Retrieve real-time Balances for each of an Item's accounts
// https://plaid.com/docs/#balance
app.get("/api/balance", function(request, response, next) {
  client.getBalance(ACCESS_TOKEN, function(error, balanceResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    prettyPrintResponse(balanceResponse);
    response.json(balanceResponse);
  });
});

// Retrieve Holdings for an Item
// https://plaid.com/docs/#investments
app.get("/api/holdings", function(request, response, next) {
  client.getHoldings(ACCESS_TOKEN, function(error, holdingsResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    prettyPrintResponse(holdingsResponse);
    response.json({ error: null, holdings: holdingsResponse });
  });
});

// Retrieve Investment Transactions for an Item
// https://plaid.com/docs/#investments
app.get("/api/investment_transactions", function(request, response, next) {
  var startDate = moment()
    .subtract(30, "days")
    .format("YYYY-MM-DD");
  var endDate = moment().format("YYYY-MM-DD");
  client.getInvestmentTransactions(ACCESS_TOKEN, startDate, endDate, function(
    error,
    investmentTransactionsResponse
  ) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    prettyPrintResponse(investmentTransactionsResponse);
    response.json({
      error: null,
      investment_transactions: investmentTransactionsResponse
    });
  });
});

// Retrieve information about an Item
// https://plaid.com/docs/#retrieve-item
app.get("/api/item", function(request, response, next) {
  // Pull the Item - this includes information about available products,
  // billed products, webhook information, and more.
  client.getItem(ACCESS_TOKEN, function(error, itemResponse) {
    if (error != null) {
      prettyPrintResponse(error);
      return response.json({
        error: error
      });
    }
    // Also pull information about the institution
    client.getInstitutionById(itemResponse.item.institution_id, function(
      err,
      instRes
    ) {
      if (err != null) {
        var msg = "Unable to pull institution information from the Plaid API.";
        console.log(msg + "\n" + JSON.stringify(error));
        return response.json({
          error: msg
        });
      } else {
        prettyPrintResponse(itemResponse);
        response.json({
          item: itemResponse.item,
          institution: instRes.institution
        });
      }
    });
  });
});

var server = app.listen(APP_PORT, function() {
  console.log("plaid-quickstart server listening on port " + APP_PORT);
});

var prettyPrintResponse = response => {
  console.log(util.inspect(response, { colors: true, depth: 4 }));
};