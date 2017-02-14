# Auth0 Extension Tools for Hapi

A set of tools and utilities to simplify the development of Auth0 Extensions with Hapi.

## Usage

```js
const hapiTools = require('auth0-extension-hapi-tools');
```

### Middlewares

A middleware to inject the Management API Client for Node.js on the current request:

```js
const middlewares = require('auth0-extension-express-tools').middlewares;

module.exports.register = (server, options, next) => {
  server.decorate('server', 'handlers', {
    managementClient: middlewares.managementApiClient({
      domain: config('AUTH0_DOMAIN'),
      clientId: config('AUTH0_CLIENT_ID'),
      clientSecret: config('AUTH0_CLIENT_SECRET'),
      logger: console.log
    })
  });

  next();
};
```

### Url Helpers

```js
const urlHelpers = require('auth0-extension-express-tools').urlHelpers;

// Eg: /api/run/mytenant/abc/
const basePath = urlHelpers.getBasePath(req);

// Eg: http://sandbox.it.auth0.com/api/run/mytenant/abc
const baseUrl = urlHelpers.getBaseUrl(req);

// Eg: http://tenant.us.webtask.io/abc
const webtaskUrl = urlHelpers.getWebtaskUrl(req);
```
