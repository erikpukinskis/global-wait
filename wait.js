var library = require("nrtv-library")(require)

if (typeof window == "undefined") {
  var window = {}
}

module.exports = library.export(
  "nrtv-wait",
  ["browser-bridge"],
  function(collectiveBridge) {

    var generator = function() {
      var context = window.__nrtvWaitContext

      if (!context) {
        context = window.__nrtvWaitContext = {
          work: {},
          waiting: []
        }
      }

      function wait(callback) {
        if (typeof callback != "function") {
          console.log(callback)
          throw new Error(callback+" is not a callback")
        }
        context.waiting.push(callback)
        setTimeout(tryToFinish)
      }

      wait.start = function pause() {
        var id = uniqueId()
        context.work[id] = true
        return id
      }

      wait.finish = function finish(id) {
        delete context.work[id]
        setTimeout(tryToFinish)
      }

      wait.shareWithIframe = function(selector) {
        document.querySelector(selector).contentWindow.__nrtvWaitContext = context
      }

      function tryToFinish() {
        for(key in context.work) {
          return
        }

        context.waiting.forEach(
          function(waiter) { waiter() }
        )

        context.waiting = []
      }

      function uniqueId() {
        do {
          var id = "wait4"+Math.random().toString(36).split(".")[1]
        } while(context.work[id])

        return id
      }

      return wait
    }

    var nodeWait = generator()

    nodeWait.defineOn =
      function(bridge) {
        var binding = bridge.__nrtvWaitBinding

        if (!binding) {
          binding = bridge.__nrtvWaitBinding = bridge.defineSingleton("wait", generator)
        }

        return binding
      }

    return nodeWait
  }
)