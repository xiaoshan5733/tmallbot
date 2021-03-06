var oauth = require('auth-server');
var util = require('util');
var uuid = require('node-uuid');

var authCodes = {};
var accessTokens = {};
var clients = {
  'tmall': {
    id: 'tmall',
    secret: 'bot',
    grantTypes: ['implicit', 'password', 'client_credentials', 'authorization_code']
  },
  'dummy': {
    id: 'dummy',
    secret: '',
    grantTypes: ['password']
  }
}
var clientService = {
  getById: function (id, callback) {
    if (id === null) {
      return callback(clients.dummy);
    } else {
      return callback(clients[id]);
    }
  },
  isValidRedirectUri: function (client, uri) {
    return true;
  }
};
var tokenService = {
  generateToken: function () {
    return uuid.v4();
  },
  generateDeviceCode: function () {
    return uuid.v4();
  }
};
var authorizationService = {
  saveAuthorizationCode: function (codeData, callback) {
    authCodes[codeData.code] = codeData;
    return callback();
  },
  saveAccessToken: function (tokenData, callback) {
    accessTokens[tokenData.access_token] = tokenData;
    return callback();
  },
  getAuthorizationCode: function (code, callback) {
    return callback(authCodes[code]);
  },
  getAccessToken: function (token, callback) {
    return callback(accessTokens[token]);
  }
};
var membershipService = {
  areUserCredentialsValid: function (userName, password, scope, callback) {
    return callback(true);
  }
};
// supportedScopes = ['profile', 'status', 'avatar'],
var supportedScopes = false;
var expiresIn = 172800; // 2 天，单位 秒
var authServer = new oauth(clientService, tokenService, authorizationService, membershipService, expiresIn, supportedScopes);
authServer.getExpiresDate = function() {
  return expiresIn * 1000;
};

var sended = false;

exports.authorize = function (req, res) {
  // console.log(req.query)
  return authServer.authorizeRequest(req, 'userid', function (response) {
    console.log(response, 'response');
    var url = response.redirectUri;
    res.redirect(url);
  });
};
var grant = function(req) {
  return new Promise(function(resolve, reject) {
    authServer.grantAccessToken(req, 'userid', function (token) {
      if (token) {
        resolve(token);
      } else {
        reject();
      }
    });
  });
};
exports.grantToken = async function (req, res) {
  var token = await grant(req);
  res.json(token);
};
exports.apiEndpoint = function (req, res) {
  authServer.validateAccessToken(req, function (validationResponse) {
    res.write(util.inspect(validationResponse));
    res.end();
  });
};