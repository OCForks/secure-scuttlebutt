'use strict'
var tape     = require('tape')
var level    = require('level-test')()
var sublevel = require('level-sublevel/bytewise')
var pull     = require('pull-stream')
var ssbKeys  = require('ssb-keys')
var createFeed = require('ssb-feed')

module.exports = function (opts) {
  var create = require('ssb-feed/message')(opts)

  var db = sublevel(level('test-ssb-feed', {
    valueEncoding: opts.codec
  }))

  var alice = ssbKeys.generate()
  var bob = ssbKeys.generate()

  var ssb = require('../')(db, opts, alice)

  var feed = ssb.createFeed(alice)

  tape('add encrypted message', function (t) {

    var boxed = ssbKeys.box({type: 'secret', okay: true}, [alice.public, bob.public])

    feed.add(boxed, function (err, msg) {

      t.notOk(err)
      console.log(msg)

      pull(
        ssb.messagesByType('secret'),
        pull.collect(function (err, ary) {
          if(err) throw err
          var ctxt = ary[0].value.content
          var content = ssbKeys.unbox(ctxt, alice.private)
          t.deepEqual(content, {type: 'secret', okay: true}, 'alice can decrypt')

          //bob can also decrypt
          var content2 = ssbKeys.unbox(ctxt, bob.private)
          t.deepEqual(content, {type: 'secret', okay: true}, 'bob can decrypt')

          t.end()
        })
      )

    })

  })



}

if(!module.parent)
  module.exports(require('../defaults'))

