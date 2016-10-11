const tools = require('auth0-extension-tools');

module.exports = function(config) {
  return {
    method: function(req, res) {
      if (req.webtaskContext) {
        config.setProvider(tools.configProvider.fromWebtaskContext(req.webtaskContext));
      }

      return res();
    }
  }
};
