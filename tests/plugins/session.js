const tape = require('tape');
const Hapi = require('hapi');
const jwt = require('hapi-auth-jwt2');
const request = require('supertest');

const session = require('../../src/plugins/session');
const certs = require('../mocks/certs');
const tokens = require('../mocks/tokens');

const onLoginSuccess = function(decoded, req, callback) {
  if (decoded) {
    return callback(null, true, decoded);
  }

  return callback(null, false);
};

const defaultPlugin = {
  register: function (server, options, next) {
    server.register({
      register: session,
      options: {
        onLoginSuccess: onLoginSuccess,
        secret: 'abc',
        audience: 'urn:api',
        rta: 'auth0.auth0.com',
        domain: 'test.auth0.com',
        baseUrl: 'https://test.auth0.com/api/v2/',
        clientName: 'Some Client'
      }
    }, next)
  }
};

defaultPlugin.register.attributes = {
  name: 'default'
};

const localStoragePlugin = {
  register: function (server, options, next) {
    server.register({
      register: session,
      options: {
        onLoginSuccess: onLoginSuccess,
        secret: 'abc',
        audience: 'urn:api',
        rta: 'auth0.auth0.com',
        domain: 'test.auth0.com',
        baseUrl: 'https://test.auth0.com/api/v2/',
        storageType: 'localStorage',
        clientName: 'Some Client'
      }
    }, next)
  }
};

localStoragePlugin.register.attributes = {
  name: 'localStorage'
};

tape('session should throw error if options is null', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.onLoginSuccess is null', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {}
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.onLoginSuccess is not a function', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: 'ok'
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.secret is null', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.secret is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.audience is null', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc'
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.audience is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.rta is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: 'urn:api',
      rta: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.domain is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: 'urn:api',
      rta: 'auth0.auth0.com',
      domain: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.baseUrl is null', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: 'urn:api',
      rta: 'auth0.auth0.com',
      domain: 'test.auth0.com'
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.baseUrl is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: 'urn:api',
      rta: 'auth0.auth0.com',
      domain: 'test.auth0.com',
      baseUrl: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should throw error if options.clientName is empty', function(t) {
  const server = new Hapi.Server();
  server.register({
    register: session,
    options: {
      onLoginSuccess: onLoginSuccess,
      secret: 'abc',
      audience: 'urn:api',
      rta: 'auth0.auth0.com',
      domain: 'test.auth0.com',
      baseUrl: 'http://api',
      clientName: ''
    }
  }, function (err) {
    t.ok(err);
    t.equal(err.name, 'ArgumentError');
    t.end();
  });
});

tape('session should redirect to auth0 on /login', function(t) {
  const server = new Hapi.Server();

  server.connection({ port: 8888 });
  server.register([ jwt, defaultPlugin ], function () {
    server.start(function() {
      request(server.listener)
        .get('/login')
        .expect(302, function(err, response) {
          server.stop();

          t.ok(!err && response && response.headers);
          const secrets = response.headers['set-cookie'].join('&');
          const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=https%3A%2F%2Ftest.auth0.com%2Fapi%2Fv2%2F' +
            '&response_type=token id_token&response_mode=form_post&scope=openid%20name%20email&expiration=36000' +
            '&redirect_uri=https%3A%2F%2F127.0.0.1%3A8888%2Flogin%2Fcallback' +
            '&audience=https%3A%2F%2Ftest.auth0.com%2Fapi%2Fv2%2F&' + secrets;

          t.equal(response.headers.location, expectedUrl);
          t.end();
        });
    });
  });
});

tape('session should return "Nonce mismatch" error in case of nonce mismatch', function(t) {
  const token = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://test.auth0.com/',
    sub: '1234567890',
    aud: 'https://test.auth0.com/api/v2/',
    name: 'John Doe',
    admin: true,
    nonce: 'nonce'
  });

  const server = new Hapi.Server();

  server.connection({ port: 8888 });
  server.register([ jwt, defaultPlugin ], function () {
    server.start(function() {
      request(server.listener)
        .post('/login/callback')
        .send({
          state: 'state',
          id_token: token,
          access_token: token
        })
        .set('Cookie', ['state=state', 'nonce=another_nonce'])
        .expect(400, function(err, res) {
          server.stop();

          t.ok(res);
          t.equal(res.body.message, 'Nonce mismatch');
          t.end();
        });
    });
  });
});

tape('session should return "State mismatch" error in case of state mismatch', function(t) {
  const token = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://test.auth0.com/',
    sub: '1234567890',
    aud: 'https://test.auth0.com/api/v2/',
    name: 'John Doe',
    admin: true,
    nonce: 'nonce'
  });

  const server = new Hapi.Server();

  server.connection({ port: 8888 });
  server.register([ jwt, defaultPlugin ], function () {
    server.start(function() {
      request(server.listener)
        .post('/login/callback')
        .send({
          state: 'state',
          id_token: token,
          access_token: token
        })
        .set('Cookie', ['state=another_state', 'nonce=nonce'])
        .expect(400, function(err, res) {
          server.stop();

          t.ok(res);
          t.equal(res.body.message, 'State mismatch');
          t.end();
        });
    });
  });
});

tape('session should return 200 if everything is ok', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  const token = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: '1234567890',
    aud: 'https://test.auth0.com/api/v2/',
    azp: 'https://test.auth0.com/api/v2/',
    name: 'John Doe',
    admin: true,
    nonce: 'nonce'
  });

  const server = new Hapi.Server();

  server.connection({ port: 8888 });
  server.register([ jwt, defaultPlugin ], function () {
    server.start(function() {
      request(server.listener)
        .post('/login/callback')
        .send({
          state: 'state',
          id_token: token,
          access_token: token
        })
        .set('Cookie', ['state=state', 'nonce=nonce'])
        .expect(200, function(err, res) {
          server.stop();

          t.ok(res && res.text && res.text.indexOf('sessionStorage.setItem("apiToken"') > 0);
          t.end();
        });
    });
  });
});

tape('session should work with localStorage', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  const token = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: '1234567890',
    aud: 'https://test.auth0.com/api/v2/',
    azp: 'https://test.auth0.com/api/v2/',
    name: 'John Doe',
    admin: true,
    nonce: 'nonce'
  });

  const server = new Hapi.Server();

  server.connection({ port: 8888 });
  server.register([ jwt, localStoragePlugin ], function () {
    server.start(function() {
      request(server.listener)
        .post('/login/callback')
        .send({
          state: 'state',
          id_token: token,
          access_token: token
        })
        .set('Cookie', ['state=state', 'nonce=nonce'])
        .expect(200, function(err, res) {
          server.stop();

          t.ok(res && res.text && res.text.indexOf('localStorage.setItem("apiToken"') > 0);
          t.end();
        });
    });
  });
});
