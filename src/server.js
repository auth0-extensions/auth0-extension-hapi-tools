const configProvider = require('auth0-extension-tools').configProvider;
const Webtask = require('webtask-tools');

module.exports.createServer = function(cb) {
  var server = null;

  return Webtask.fromHapi(function hapiFactory(webtaskContext) {
    if (!server) {
      const config = configProvider.fromWebtaskContext(webtaskContext);
      server = cb(config, webtaskContext.storage);
    }

    return server;
  });
};
