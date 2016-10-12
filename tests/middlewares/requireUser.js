const tape = require('tape');

const requireUser = require('../../src/handlers').requireUser.method;

tape('requireUser should continue if user is set', function(t) {
  requireUser(
    { user: { name: 'foo' } },
    function(err) {
      t.notOk(err);
      t.end();
    }
  );
});

tape('requireUser should return error if user is not set', function(t) {
  requireUser(
    { },
    function(err) {
      t.ok(err);
      t.ok(err.isBoom);
      t.ok(err.output);
      t.ok(err.output.payload);
      t.equal(err.output.payload.error, 'Unauthorized');
      t.end();
    }
  );
});
