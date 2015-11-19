var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-wait",
  ["nrtv-browser-bridge"],
  function(bridge) {

    function wait() {
      for(var i=0; i<arguments.length; i++) {
        var arg = arguments[i]
        switch(typeof arg) {
          case "function":
            var callback = arg
            break
          case "string":
            if (arg == "start" || arg == "done") {
              var command = arg
            } else {
              var id = arg
            }
            break
          case "object":
            var context = arg
        }
      }

      context = context || document

      setup()

      function uniqueId() {
        var pending = context.__nrtvWaitPending

        do {
          var id = Math.random().toString(36).split(".")[1]
        } while(id != "done" && id != "start" && pending && pending[id])

        return id
      }

      if (command == "start") {
        var id = uniqueId()
        context.__nrtvWaitPending[id] = true
        return id
      } else if (command == "done") {
        delete context.__nrtvWaitPending[id]
        setTimeout(tryToFinish)
      } else if (callback) {
        context.__nrtvWaitCallbacks.push(callback)
        setTimeout(tryToFinish)
      }

      var contextId

      function setup() {
        if (!context.__nrtvWaitPending) {
          context.__nrtvWaitPending = {}
          context.__nrtvWaitCallbacks = []
        }
      }

      function tryToFinish() {
        for(key in context.__nrtvWaitPending) {
          return
        }

        context.__nrtvWaitCallbacks.forEach(
          function(waiter) { waiter() }
        )

        context.__nrtvWaitCallbacks = []
      }
    }

    var nodeWait = wait.bind(null)

    if (!document) {
      var document = nodeWait.mockDocument = {}
    }

    nodeWait.defineInBrowser = function() {
      return bridge.defineFunction(wait)
    }

    return nodeWait
  }
)