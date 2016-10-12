const tools = require('auth0-extension-tools');
const Boom = require('boom');

module.exports = {
  method: function(req, res) {
    if (!req.user) {
      return res(Boom.unauthorized(new tools.UnauthorizedError('Authentication required for this endpoint.')));
    }

    return res();
  }
};
