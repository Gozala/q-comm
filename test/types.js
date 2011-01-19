'use strict'

var utils = require('./fixtures')
var Q = require('q')

exports['test post json data'] = function (assert, done) {
  var received, sent, rpc

  sent = { foo: 'bar', baz: { bzz: 'z!' } }
  rpc = utils.createPeers({
    save: function (data) {
      return received = data
    }
  })

  Q.when(Q.post(rpc.remote, 'save', sent), function(value) {
    assert.notEqual(value, sent, 'data returned is different form data sent')
    assert.notEqual(received, sent, 'data received is different form data sent')
    assert.notEqual(received, value,
                    'data returned is different from data received')
    assert.equal(JSON.stringify(sent), JSON.stringify(received),
                 'data received is a copy of the data sent')
    done()
  }, function (reason) {
    assert.fail(reason)
    done()
  })
}

exports['test modify remote object'] = function (assert, done) {
  var remoteValue, rpc, test

  remoteValue = Object.create({}, { foo: { value: 'bar', writable: true } })
  rpc = utils.createPeers({
    getValue: function () {
      return remoteValue
    }
  })

  test = Q.when(Q.post(rpc.remote, 'getValue'), function(promise) {
    assert.ok(Q.isPromise(promise), 'should resolve to a remote promise')
    return Q.when(Q.get(promise, 'foo'), function (value) {
      assert.equal(value, 'bar', 'should resolve to an actual value')
      return Q.when(Q.put(promise, 'foo', 'baz'), function (value) {
        assert.equal(remoteValue.foo, 'baz', 'remote value changed')
        assert.equal(remoteValue.foo, value, 'resolved to remote value')
        return Q.when(Q.post(rpc.remote, 'getValue'), function(promise2) {
          /* Preserving identity would be awesome but not clear how to do
             that yet so test is disabled so far.
          assert.equal(promise, promise2,
                       'same remote object should resolves to a same promise')
          */
          // Ideally we should not do that but there is a bug see comment at
          // the end of the test for details.
          done()
        })
      })
    })
  })
  
  // We should not return here since failure needs to be logged but for some
  // strange reason test promise is resolved before when callback is called,
  // probably bug in Q.
  return
  Q.when(test, done, function (reason) {
    done(assert.fail(reason))
  })
}

exports['test post an object'] = function (assert, done) {
  var sent, rpc

  sent = {
    callback: function(data) {
      // identity issue still not solved
      // assert.equal(data, sent, 'value is decoded to the same instance')
      done()
    }
  }

  rpc = utils.createPeers({
    test: function (promise) {
      assert.ok(Q.isPromise(promise), 'received value must be a promise')
      // Sending promise back by invoking method on promise
      Q.post(promise, 'callback', promise)
    }
  })

  Q.when(Q.post(rpc.remote, 'test', sent), null, function (reason) {
    done(assert.fail(reason))
  })
}

exports['test post a callback'] = function (assert, done) {
  var sent, rpc

  sent = function callback() {
    assert.pass('callback was called')
    done()
  }
  rpc = utils.createPeers({
    listener: function (callback) {
      assert.ok(Q.isPromise(callback), 'received promise for the callback')
      Q.post(callback, 'call', null)
    }
  })

  Q.when(Q.post(rpc.remote, 'listener', sent), null, function(reason) {
    done(assert.fail(reason))
  })
}

if (module == require.main) require('test').run(exports)
