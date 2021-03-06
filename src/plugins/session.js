const Boom = require('boom');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const tools = require('auth0-extension-tools');

const urlHelpers = require('../urlHelpers');

const buildUrl = function(paths) {
  return path.join.apply(null, paths)
    .replace(/\\/g, '/')
    .replace('http:/', 'http://')
    .replace('https:/', 'https://');
};

const findCookie = function(cookie, value) {
  return Array.isArray(cookie) ? cookie.indexOf(value) === -1 : cookie !== value;
};

module.exports.register = function(server, options, next) {
  if (!options || typeof options !== 'object') {
    return next(new tools.ArgumentError('Must provide the options'));
  }

  if (options.onLoginSuccess === null || options.onLoginSuccess === undefined) {
    return next(new tools.ArgumentError('Must provide a valid login callback'));
  }

  if (options.secret === null || options.secret === undefined) {
    return next(new tools.ArgumentError('Must provide a valid secret'));
  }

  if (typeof options.secret !== 'string' || options.secret.length === 0) {
    return next(new tools.ArgumentError('The provided secret is invalid: ' + options.secret));
  }

  if (options.audience === null || options.audience === undefined) {
    return next(new tools.ArgumentError('Must provide a valid audience'));
  }

  if (typeof options.audience !== 'string' || options.audience.length === 0) {
    return next(new tools.ArgumentError('The provided audience is invalid: ' + options.audience));
  }

  if (options.rta === null || options.rta === undefined) {
    return next(new tools.ArgumentError('Must provide a valid rta'));
  }

  if (typeof options.rta !== 'string' || options.rta.length === 0) {
    return next(new tools.ArgumentError('The provided rta is invalid: ' + options.rta));
  }

  if (options.domain === null || options.domain === undefined) {
    return next(new tools.ArgumentError('Must provide a valid domain'));
  }

  if (typeof options.domain !== 'string' || options.domain.length === 0) {
    return next(new tools.ArgumentError('The provided domain is invalid: ' + options.domain));
  }

  if (options.baseUrl === null || options.baseUrl === undefined) {
    return next(new tools.ArgumentError('Must provide a valid base URL'));
  }

  if (typeof options.baseUrl !== 'string' || options.baseUrl.length === 0) {
    return next(new tools.ArgumentError('The provided base URL is invalid: ' + options.baseUrl));
  }

  if (options.clientName === null || options.clientName === undefined) {
    return next(new tools.ArgumentError('Must provide a valid client name'));
  }

  if (typeof options.clientName !== 'string' || options.clientName.length === 0) {
    return next(new tools.ArgumentError('The provided client name is invalid: ' + options.clientName));
  }

  const stateKey = options.stateKey || 'state';
  const nonceKey = options.nonceKey || 'nonce';
  const urlPrefix = options.urlPrefix || '';
  const sessionStorageKey = options.sessionStorageKey || 'apiToken';
  const sessionManager = options.sessionManager || new tools.SessionManager(options.rta, options.domain, options.baseUrl);
  const basicCookieAttr = {
    isHttpOnly: true
  };
  server.state(nonceKey, Object.assign({}, basicCookieAttr, { isSameSite: 'None', isSecure: true }));
  server.state(stateKey, Object.assign({}, basicCookieAttr, { isSameSite: 'None', isSecure: true }));
  server.state(nonceKey + '_compat', basicCookieAttr);
  server.state(stateKey + '_compat', basicCookieAttr);


  server.route({
    method: 'GET',
    path: urlPrefix + '/login',
    config: {
      auth: false
    },
    handler: function(req, reply) {
      const state = crypto.randomBytes(16).toString('hex');
      const nonce = crypto.randomBytes(16).toString('hex');

      const redirectTo = sessionManager.createAuthorizeUrl({
        redirectUri: buildUrl([ urlHelpers.getBaseUrl(req), urlPrefix, '/login/callback' ]),
        scopes: options.scopes,
        expiration: options.expiration,
        nonce: nonce,
        state: state
      });
      reply.redirect(redirectTo)
        .state(nonceKey, nonce, { path: urlHelpers.getBasePath(req) })
        .state(stateKey, state, { path: urlHelpers.getBasePath(req) })
        .state(nonceKey + '_compat', nonce, { path: urlHelpers.getBasePath(req) })
        .state(stateKey + '_compat', state, { path: urlHelpers.getBasePath(req) });
    }
  });

  server.route({
    method: 'POST',
    path: urlPrefix + '/login/callback',
    config: {
      auth: false
    },
    handler: function(req, reply) {
      var decoded;

      try {
        decoded = jwt.decode(req.payload.id_token);
      } catch (e) {
        decoded = null;
      }

      if (!decoded) {
        return reply(Boom.unauthorized('Invalid token'));
      }
      // handle multiple cookies with same name
      if ((req.state && req.state[nonceKey] && findCookie(req.state[nonceKey], decoded.nonce)) || (req.state && req.state[nonceKey + '_compat'] && findCookie(req.state[nonceKey + '_compat'], decoded.nonce))) {
        return reply(Boom.badRequest('Nonce mismatch'));
      }
      if ((req.state && req.state[stateKey] && findCookie(req.state[stateKey], req.payload.state)) || (req.state && req.state[stateKey + '_compat'] && findCookie(req.state[stateKey + '_compat'], req.payload.state))) {
        return reply(Boom.badRequest('State mismatch'));
      }
      return sessionManager.create(req.payload.id_token, req.payload.access_token, {
        secret: options.secret,
        issuer: options.baseUrl,
        audience: options.audience
      }).then(function(token) {
        reply('<html>' +
          '<head>' +
          '<script type="text/javascript">' +
          'sessionStorage.setItem("' + sessionStorageKey + '", "' + token + '");' +
          'window.location.href = "' + buildUrl([ urlHelpers.getBaseUrl(req), '/' ]) + '";' +
          '</script>' +
          '</head>' +
          '</html>')
          .unstate(nonceKey, { path: urlHelpers.getBasePath(req) })
          .unstate(stateKey, { path: urlHelpers.getBasePath(req) })
          .unstate(nonceKey + '_compat', { path: urlHelpers.getBasePath(req) })
          .unstate(stateKey + '_compat', { path: urlHelpers.getBasePath(req) });
      }).catch(function(err) {
        server.log([ 'error' ], 'Login callback failed', err);
        reply(Boom.wrap(err));
      });
    }
  });

  server.route({
    method: 'GET',
    path: urlPrefix + '/logout',
    config: {
      auth: false
    },
    handler: function(req, reply) {
      const encodedBaseUrl = encodeURIComponent(buildUrl([ urlHelpers.getBaseUrl(req), '/' ]));
      reply('<html>' +
        '<head>' +
        '<script type="text/javascript">' +
        'sessionStorage.removeItem("' + sessionStorageKey + '");' +
        'window.location.href = "https://' + options.rta + '/v2/logout/?returnTo=' + encodedBaseUrl + '&client_id=' + encodedBaseUrl + '";' +
        '</script>' +
        '</head>' +
        '</html>')
        .unstate(nonceKey, { path: urlHelpers.getBasePath(req) })
        .unstate(stateKey, { path: urlHelpers.getBasePath(req) })
        .unstate(nonceKey + '_compat', { path: urlHelpers.getBasePath(req) })
        .unstate(stateKey + '_compat', { path: urlHelpers.getBasePath(req) });
    }
  });

  server.route({
    method: 'GET',
    path: '/.well-known/oauth2-client-configuration',
    config: {
      auth: false
    },
    handler: function(req, reply) {
      reply({
        redirect_uris: [ buildUrl([ urlHelpers.getBaseUrl(req), urlPrefix, '/login/callback' ]) ],
        client_name: options.clientName,
        post_logout_redirect_uris: [ buildUrl([ urlHelpers.getBaseUrl(req), '/' ]) ]
      });
    }
  });

  server.auth.strategy('auth0-admins-jwt', 'jwt', {
    key: options.secret,
    validateFunc: options.onLoginSuccess,
    verifyOptions: {
      audience: options.audience,
      issuer: options.baseUrl,
      algorithms: [ 'HS256' ]
    }
  });

  return next();
};

module.exports.register.attributes = {
  name: 'dashboard-admin-session'
};
