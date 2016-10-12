const tape = require('tape');

const managementApiClientMiddleware = require('../../src/handlers').managementApiClient;

tape('managementApiClient should attach client to the request', function(t) {
  const options = {
    domain: 'me.auth0.com',
    accessToken: 'ey'
  };

  const mw = managementApiClientMiddleware(options);
  t.ok(mw);

  const req = { };

  mw.method(req, function(data) {
    t.ok(data);
    t.ok(data.users);
    t.ok(data.users.getAll);
    t.end();
  });
});

tape('managementApiClient errors should bubble up in the middleware', function(t) {
  const options = {
    domain: 'me.auth0.com',
    clientId: 'foo',
    clientSecret: 'bar',
    logger: function() {}
  };

  const mw = managementApiClientMiddleware(options);
  t.ok(mw);

  const req = { };
  mw.method(req, function(data) {
    t.ok(data);
    t.ok(data.isBoom);
    t.notOk(data.users);
    t.end();
  });
});

tape('managementApiClient should throw error if no options provided', function(t) {
  const options = null;

  t.throws(function() {
    managementApiClientMiddleware(options);
  });
  t.end();
});

tape('managementApiClient should throw error if no domain provided', function(t) {
  const options = {};

  t.throws(function() {
    managementApiClientMiddleware(options);
  });
  t.end();
});
