const configProvider = require('auth0-extension-tools').configProvider;
const Webtask = require('webtask-tools');

module.exports.createServer = function(cb) {
  var server = null;

  return fromHapi(function hapiFactory(webtaskContext) {
    if (!server) {
      const config = configProvider.fromWebtaskContext(webtaskContext);
      server = cb(config, webtaskContext.storage);
    }

    return server;
  });
};

const SANITIZE_RX = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

function fromHapi(serverFactory) {
  var hapiServer;
  var webtaskContext;

  return function(context, req, res) {
    webtaskContext = attachStorageHelpers(context);

    if (hapiServer == null) {
      hapiServer = serverFactory(webtaskContext);
      hapiServer.ext('onRequest', function(hapiRequest, reply) {
        var normalizeRouteRx = createRouteNormalizationRx(hapiRequest.raw.req.x_wt);
        if (normalizeRouteRx) {
          hapiRequest.setUrl(hapiRequest.url.path.replace(normalizeRouteRx, '/'));
        }

        hapiRequest.webtaskContext = webtaskContext;
        return reply.continue();
      });
    }

    var dispatch = hapiServer.connections[0]._dispatch();
    dispatch(req, res);
  };
}

const USE_WILDCARD_DOMAIN = 3;
const USE_CUSTOM_DOMAIN = 2;
const USE_SHARED_DOMAIN = 1;

function createRouteNormalizationRx(claims) {
  if (!claims.container) {
    return null;
  }

  var container = claims.container.replace(SANITIZE_RX, '\\$&');
  var name = claims.jtn
      ? claims.jtn.replace(SANITIZE_RX, '\\$&')
      : '';

  if (claims.url_format === USE_SHARED_DOMAIN) {
    return new RegExp('^\/api/run/' + container + '/(?:' + name + '\/?)?');
  } else if (claims.url_format === USE_CUSTOM_DOMAIN) {
    return new RegExp('^\/' + container + '/(?:' + name + '\/?)?');
  } else if (claims.url_format === USE_WILDCARD_DOMAIN) {
    return new RegExp('^\/(?:' + name + '\/?)?');
  } else {
    throw new Error('Unsupported webtask URL format.');
  }
}

function attachStorageHelpers(context) {
  context.read = context.secrets.EXT_STORAGE_URL
      ? readFromPath
      : readNotAvailable;
  context.write = context.secrets.EXT_STORAGE_URL
      ? writeToPath
      : writeNotAvailable;

  return context;


  function readNotAvailable(path, options, cb) {
    var Boom = require('boom');

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    cb(Boom.preconditionFailed('Storage is not available in this context'));
  }

  function readFromPath(path, options, cb) {
    var Boom = require('boom');
    var Request = require('request');

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    Request({
      uri: context.secrets.EXT_STORAGE_URL,
      method: 'GET',
      headers: options.headers || {},
      qs: { path: path },
      json: true
    }, function(err, res, body) {
      if (err) return cb(Boom.wrap(err, 502));
      if (res.statusCode === 404 && Object.hasOwnProperty.call(options, 'defaultValue')) return cb(null, options.defaultValue);
      if (res.statusCode >= 400) return cb(Boom.create(res.statusCode, body && body.message));

      cb(null, body);
    });
  }

  function writeNotAvailable(path, data, options, cb) {
    var Boom = require('boom');

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    cb(Boom.preconditionFailed('Storage is not available in this context'));
  }

  function writeToPath(path, data, options, cb) {
    var Boom = require('boom');
    var Request = require('request');

    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    Request({
      uri: context.secrets.EXT_STORAGE_URL,
      method: 'PUT',
      headers: options.headers || {},
      qs: { path: path },
      body: data
    }, function(err, res, body) {
      if (err) return cb(Boom.wrap(err, 502));
      if (res.statusCode >= 400) return cb(Boom.create(res.statusCode, body && body.message));

      cb(null);
    });
  }
}
