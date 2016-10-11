const tools = require('auth0-extension-tools');
const Boom = require('boom');

module.exports = function(options) {
  if (!options || typeof options !== 'object') {
    throw new tools.ArgumentError('Must provide the options');
  }

  return {
    method: function(req, res) {
      if (!req.user) {
        return res(Boom.unauthorized(new tools.UnauthorizedError('Authentication required for this endpoint.')));
      }

      return res();
    }
  };
};
