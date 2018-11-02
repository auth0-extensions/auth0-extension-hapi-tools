const test = require('tape');
const Server = require('hapi').Server;
const jwt2 = require('hapi-auth-jwt2');
const jwt = require('jsonwebtoken');
const url = require('url');
const tools = require('auth0-extension-tools');

const session = require('../../src/plugins/session');

const before = test;

test('session#register should fail if no options provided', (t) => {
  const plugin = {
    register: session,
    options: 'opts'
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide the options');
    t.end();
  });
});

test('session#register should fail if no callback provided', (t) => {
  // options get defaulted to {} unless explicitly set
  const plugin = {
    register: session
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid login callback');
    t.end();
  });
});

test('session#register should fail if no secret provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid secret');
    t.end();
  });
});

test('session#register should fail if secret is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided secret is invalid: ');
    t.end();
  });
});

test('session#register should fail if no audience provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'asecret'
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid audience');
    t.end();
  });
});

test('session#register should fail if audience is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'asecret',
      audience: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided audience is invalid: ');
    t.end();
  });
});

test('session#register should fail if no rta provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience'
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid rta');
    t.end();
  });
});

test('session#register should fail if rta is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided rta is invalid: ');
    t.end();
  });
});

test('session#register should fail if no domain provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta'
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid domain');
    t.end();
  });
});

test('session#register should fail if domain is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided domain is invalid: ');
    t.end();
  });
});

test('session#register should fail if no baseUrl provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain'
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid base URL');
    t.end();
  });
});

test('session#register should fail if baseUrl is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain',
      baseUrl: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided base URL is invalid: ');
    t.end();
  });
});

test('session#register should fail if no clientName provided', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain',
      baseUrl: 'baseUrl'
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'Must provide a valid client name');
    t.end();
  });
});

test('session#register should fail if clientName is invalid', (t) => {
  const plugin = {
    register: session,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain',
      baseUrl: 'baseUrl',
      clientName: ''
    }
  };

  new Server().register(plugin, (err) => {
    t.equal(err.message, 'The provided client name is invalid: ');
    t.end();
  });
});

// --------------------------------------------------
const opts = {
  rta: 'auth0.auth0.com',
  domain: 'hapi.auth0.com',
  scopes: 'read:clients',
  baseUrl: 'https://test.us.webtask.io/adf6e2f2b84784b57522e3b19dfc9201',
  audience: 'urn:api-hapi',
  secret: 'asecret',
  clientName: 'Hapi Extension',
  onLoginSuccess: (decoded, req, cb) => cb(null, !!decoded, decoded)
};
const sessionManager = new tools.SessionManager(opts.rta, opts.domain, opts.baseUrl);
sessionManager.create = () => Promise.resolve('mytoken'); // mock create
opts.sessionManager = sessionManager;

let server;

before('before', (t) => {
  const plugin = {
    register: session,
    options: opts
  };
  server = new Server();
  server.connection({ port: 8080 });
  server.register([ jwt2, plugin ], () => {
    t.pass('setup server');
    t.end();
  });
});

test('session#routes.login', (t) => {
  const options = {
    method: 'GET',
    url: '/login'
  };

  server.inject(options, (response) => {
    const loc = url.parse(response.headers.location, true);
    const states = response.request._states; // eslint-disable-line
    t.equal(loc.query.nonce, states.nonce.value);
    t.equal(loc.query.state, states.state.value);

    t.end();
  });
});

test('session#routes.login.callback', (t) => {
  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: 'asdf'
    }
  };

  server.inject(options, (response) => {
    t.deepEqual(response.result, {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid token'
    });

    t.end();
  });
});

test('session#routes.login.callback nonce mismatch', (t) => {
  const token = { nonce: '123' };

  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce=456; nonce=789;'
    }
  };

  server.inject(options, (response) => {
    t.equal(response.statusCode, 400);
    t.deepEqual(response.result, {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Nonce mismatch'
    });
    t.end();
  });
});

test('session#routes.login.callback state mismatch', (t) => {
  const token = { nonce: '123' };

  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      state: '123',
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce=123; state=321;'
    }
  };

  server.inject(options, (response) => {
    t.equal(response.statusCode, 400);
    t.deepEqual(response.result, {
      statusCode: 400,
      error: 'Bad Request',
      message: 'State mismatch'
    });
    t.end();
  });
});

test('session#routes.login.callback nonce passed', (t) => {
  const token = { nonce: '123' };

  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce=456; nonce=123;'
    }
  };

  server.inject(options, (response) => {
    t.equal(response.headers['set-cookie'].length, 2);
    const cookies = response.headers['set-cookie'].map(c => c.split(';')[0]);
    t.equal(cookies[0], 'nonce=');
    t.equal(cookies[1], 'state=');
    t.end();
  });
});

test('session#routes.logout should clear cookies', (t) => {
  const options = {
    method: 'GET',
    url: '/logout'
  };

  server.inject(options, (response) => {
    t.equal(response.headers['set-cookie'].length, 2);
    const cookies = response.headers['set-cookie'].map(c => c.split(';')[0]);
    t.equal(cookies[0], 'nonce=');
    t.equal(cookies[1], 'state=');
    t.end();
  });
});

test('session should return 200 if everything is ok', (t) => {
  const token = {
    iss: 'https://auth0.auth0.com/',
    sub: '1234567890',
    aud: 'https://test.auth0.com/api/v2/',
    azp: 'https://test.auth0.com/api/v2/',
    name: 'John Doe',
    admin: true,
    nonce: 'nonce'
  };

  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      state: 'state',
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce=nonce; state=state;'
    }
  };

  server.inject(options, (response) => {
    t.equal(response.statusCode, 200);
    t.ok(response.result && response.result.indexOf('sessionStorage.setItem("apiToken"') > 0);
    t.end();
  });
});
