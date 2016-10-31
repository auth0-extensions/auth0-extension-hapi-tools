const jwt = require('hapi-auth-jwt2');
const tools = require('auth0-extension-tools');
const Boom = require('boom');
const urlHelpers = require('../urlHelpers');

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
    return next(new tools.ArgumentError('Must provide a valid secret'));
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

  if (options.clientName === null || options.clientName === undefined) {
    return next(new tools.ArgumentError('Must provide a valid client name'));
  }

  if (typeof options.clientName !== 'string' || options.clientName.length === 0) {
    return next(new tools.ArgumentError('The provided client name is invalid: ' + options.clientName));
  }

  server.route({
    method: 'GET',
    path: '/login',
    config: {
      auth: false
    },
    handler: (req, reply) => {
      const sessionManager = new tools.SessionManager(options.rta, options.domain, options.clientId || urlHelpers.getBaseUrl(req));
      reply.redirect(sessionManager.createAuthorizeUrl({
        redirectUri: urlHelpers.getBaseUrl(req) + '/login/callback',
        scopes: options.scopes,
        expiration: options.expiration
      }));
    }
  });

  server.route({
    method: 'POST',
    path: '/login/callback',
    config: {
      auth: false
    },
    handler: (req, reply) => {
      const sessionManager = new tools.SessionManager(options.rta, options.domain, options.clientId || urlHelpers.getBaseUrl(req));
      sessionManager.create(req.payload.id_token, req.payload.access_token, {
        secret: options.secret,
        issuer: urlHelpers.getBaseUrl(req),
        audience: options.audience
      }).then(function(token) {
        reply.redirect(urlHelpers.getBaseUrl(req) + '#api_token=' + token);
      })
      .catch(function(err) {
        server.log([ 'error' ], 'Login callback failed', err);
        reply(Boom.wrap(err));
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/.well-known/oauth2-client-configuration',
    config: {
      auth: false
    },
    handler: (req, reply) => {
      reply({
        redirect_uris: [ urlHelpers.getBaseUrl(req) + '/login/callback' ],
        client_name: options.clientName,
        post_logout_redirect_uris: [ urlHelpers.getBaseUrl(req) ]
      });
    }
  });

  server.register(jwt, (err) => {
    if (err) {
      next(err);
    }

    server.auth.strategy('jwt', 'jwt', {
      key: options.secret,
      validateFunc: options.onLoginSuccess,

      // Validate the audience and the issuer.
      verifyOptions: {
        audience: options.audience,
        issuer: options.clientId,
        algorithms: [ 'HS256' ]
      }
    });
  });

  return next();
};

module.exports.register.attributes = {
  name: 'dashboard-admin-session'
};
