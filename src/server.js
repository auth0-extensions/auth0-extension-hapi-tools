const tools = require('auth0-extension-tools');
const Webtask = require('webtask-tools');

module.exports.createServer = function(cb) {
  return Webtask.fromHapi(tools.createServer(cb));
};
