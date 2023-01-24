const test = require('tape');
const Server = require('@hapi/hapi').Server;
const jwt2 = require('hapi-auth-jwt2');
const jwt = require('jsonwebtoken');
const url = require('url');
const tools = require('auth0-extension-tools');

const plugins = require('../../src').plugins;

const before = test;

function parseCookie(cookie) {
  return cookie.split(';').reduce(function (prev, curr) {
    if (!curr.includes('=')) {
      prev[curr.trim()] = true;
      return prev;
    }
    const m = / *([^=]+)=(.*)/.exec(curr);
    const key = m[1];
    const value = decodeURIComponent(m[2]);
    prev[key] = value;
    return prev;
  }, {});
}

test('session#register should fail if no options provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: 'opts'
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide the options');
    t.end();
  }
});

test('session#register should fail if no callback provided', async (t) => {
  // options get defaulted to {} unless explicitly set
  const plugin = {
    plugin: plugins.dashboardAdminSession
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid login callback');
    t.end();
  }
});

test('session#register should fail if no secret provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid secret');
    t.end();
  }
});

test('session#register should fail if secret is invalid', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: ''
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided secret is invalid: ');
    t.end();
  }
});

test('session#register should fail if no audience provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'asecret'
    }
  };


  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid audience');
    t.end();
  }
});

test('session#register should fail if audience is invalid', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'asecret',
      audience: ''
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided audience is invalid: ');
    t.end();
  }
});

test('session#register should fail if no rta provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience'
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid rta');
    t.end();
  }
});

test('session#register should fail if rta is invalid', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: ''
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided rta is invalid: ');
    t.end();
  }
});

test('session#register should fail if no domain provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta'
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid domain');
    t.end();
  }
});

test('session#register should fail if no domain provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: ''
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided domain is invalid: ');
    t.end();
  }
});

test('session#register should fail if no baseUrl provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain'
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid base URL');
    t.end();
  }
});

test('session#register should fail if no baseUrl provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain',
      baseUrl: ''
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided base URL is invalid: ');
    t.end();
  }
});

test('session#register should fail if no clientName provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
    options: {
      onLoginSuccess: () => null,
      secret: 'secret',
      audience: 'audience',
      rta: 'rta',
      domain: 'domain',
      baseUrl: 'baseUrl'
    }
  };

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'Must provide a valid client name');
    t.end();
  }
});

test('session#register should fail if no clientName provided', async (t) => {
  const plugin = {
    plugin: plugins.dashboardAdminSession,
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

  try {
    await new Server().register(plugin);
    t.fail();
  } catch (err) {
    t.equal(err.message, 'The provided client name is invalid: ');
    t.end();
  }
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

before('before', async (t) => {
  const session = {
    plugin: plugins.dashboardAdminSession,
    options: opts
  };
  server = new Server({
    port: 8080
  });
  await server.register([jwt2, session]);
  t.pass('setup server');
});

test('session#routes.login', async (t) => {
  const response = await server.inject('/login');

  const loc = url.parse(response.headers.location, true);
  const states = response.request._states; // eslint-disable-line
  t.equal(loc.query.nonce, states.nonce.value);
  t.equal(loc.query.state, states.state.value);

  t.end();
});

test('session#routes.login.callback', async (t) => {
  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: 'asdf'
    }
  };

  const response = await server.inject(options);
  t.deepEqual(response.result, {
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Invalid token'
  });

  t.end();
});

test('session#routes.login.callback nonce mismatch', async (t) => {
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

  const response = await server.inject(options);
  t.equal(response.statusCode, 400);
  t.deepEqual(response.result, {
    statusCode: 400,
    error: 'Bad Request',
    message: 'Nonce mismatch'
  });
  t.end();
});

test('session#routes.login.callback legacy nonce mismatch', async (t) => {
  const token = { nonce_compat: '123' };

  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce_compat=456; nonce_compat=789;'
    }
  };

  const response = await server.inject(options);
  t.equal(response.statusCode, 400);
  t.deepEqual(response.result, {
    statusCode: 400,
    error: 'Bad Request',
    message: 'Nonce mismatch'
  });
  t.end();
});

test('session#routes.login.callback nonce passed', async (t) => {
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

  const response = await server.inject(options);
  t.equal(response.headers['set-cookie'].length, 4);
  const cookies = response.headers['set-cookie'].map(c => c.split(';')[0]);
  t.equal(cookies[0], 'nonce=');
  t.equal(cookies[1], 'state=');
  t.end();
});

test('session#routes.login.callback legacy nonce passed', async (t) => {
  const token = { nonce: '123' };
  const options = {
    method: 'POST',
    url: '/login/callback',
    payload: {
      id_token: jwt.sign(token, opts.secret)
    },
    headers: {
      Cookie: 'nonce_compat=456; nonce_compat=123;'
    }
  };

  const response = await server.inject(options);
  t.equal(response.headers['set-cookie'].length, 4);
  const cookies = response.headers['set-cookie'].map(c => parseCookie(c));
  t.equal(cookies[0].nonce, '');
  t.equal(cookies[0].SameSite, 'None');
  t.equal(cookies[0].Secure, true);
  t.equal(cookies[1].state, '');
  t.equal(cookies[1].SameSite, 'None');
  t.equal(cookies[1].Secure, true);
  t.equal(cookies[2].nonce_compat, '');
  t.false(cookies[2].SameSite);
  t.false(cookies[2].Secure);
  t.equal(cookies[3].state_compat, '');
  t.false(cookies[3].SameSite);
  t.false(cookies[3].Secure);
  t.end();
});

test('session#routes.logout should clear cookies', async (t) => {
  const options = {
    method: 'GET',
    url: '/logout'
  };

  const response = await server.inject(options);
  t.equal(response.headers['set-cookie'].length, 4);
  const cookies = response.headers['set-cookie'].map(c => c.split(';')[0]);
  t.equal(cookies[0], 'nonce=');
  t.equal(cookies[1], 'state=');
  t.equal(cookies[2], 'nonce_compat=');
  t.equal(cookies[3], 'state_compat=');
  t.end();
});
