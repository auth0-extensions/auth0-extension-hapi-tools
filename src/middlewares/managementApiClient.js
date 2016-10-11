const tools = require('auth0-extension-tools');
const Boom = require('boom');

module.exports = function(options) {
  if (!options || typeof options != 'object') {
    throw new tools.ArgumentError('Must provide the options');
  }

  if (typeof options.domain !== 'string' || options.domain.length === 0) {
    throw new tools.ArgumentError('The provided domain is invalid: ' + domain);
  }

  if (typeof options.clientId !== 'string' || options.clientId.length === 0) {
    throw new tools.ArgumentError('The provided clientId is invalid: ' + clientId);
  }

  if (typeof options.clientSecret !== 'string' || options.clientSecret.length === 0) {
    throw new tools.ArgumentError('The provided clientSecret is invalid');
  }

  return {
    method: function(req, res) {
      tools.managementApi.getClient(options)
        .then(function(auth0) {
          res(auth0)
        })
        .catch(function(err) {
          if (options.logger && typeof options.logger === 'function') {
            options.logger(err.message || err.code);
          }

          res(Boom.wrap(err));
        });
    },
    assign: 'auth0'
  }
};
