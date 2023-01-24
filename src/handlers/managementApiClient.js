const tools = require('auth0-extension-tools');
const Boom = require('@hapi/boom');

module.exports = function(handlerOptions) {
  if (!handlerOptions || typeof handlerOptions !== 'object') {
    throw new tools.ArgumentError('Must provide the options');
  }

  if (typeof handlerOptions.domain !== 'string' || handlerOptions.domain.length === 0) {
    throw new tools.ArgumentError('The provided domain is invalid: ' + handlerOptions.domain);
  }

  return {
    method: function(req, res) {
      const isAdministrator = req.auth && req.auth.credentials && req.auth.credentials.access_token && req.auth.credentials.access_token.length;
      const options = !isAdministrator ? handlerOptions : {
        domain: handlerOptions.domain,
        accessToken: req.auth.credentials.access_token
      };

      tools.managementApi.getClient(options)
        .then(function(auth0) {
          res(auth0);
        })
        .catch(function(err) {
          if (handlerOptions.logger && typeof handlerOptions.logger === 'function') {
            handlerOptions.logger(err.message || err.code);
          }

          res(Boom.boomify(err));
        });
    },
    assign: 'auth0'
  };
};
