var library = require("nrtv-library")(require)

module.exports = library.export(
  "nrtv-wait",
  [library.collective({})],
  function(collective) {

    function wait(collective) {
      for(var i=0; i<arguments.length; i++) {
        var arg = arguments[i]
        switch(typeof arguments[i]) {
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
        var ours = collective[contextId]

        do {
          var id = Math.random().toString(36).split(".")[1]
        } while(id != "done" && id != "start" && ours && ours.pending[id])

        return id
      }

      if (command == "start") {
        var id = uniqueId()
        collective[contextId].pending[id] = true
        return id
      } else if (command == "done") {
        delete collective[contextId].pending[id]
        tryToFinish()
      } else if (callback) {
        collective[contextId].waiters.push(callback)
        tryToFinish()
      }

      var contextId

      function setup() {
        contextId = context.__nrtvWaitId

        if (!contextId) {
          contextId = context.__nrtvWaitId = uniqueId()
        }

        if (!collective[contextId]) {
          collective[contextId] = {
            pending: {},
            waiters: []
          }
        }
      }

      function tryToFinish() {
        for(key in collective[contextId].pending) {
          return
        }

        collective[contextId].waiters.forEach(
          function(waiter) { waiter() }
        )

        collective[contextId].waiters = []
      }
    }

    if (!document) {
      var document = wait.mockDocument = {}
    }

    var wait = wait.bind(null, collective)

    wait.defineInBrowser =
      function() {
        return bridge.defineFunction(
          [bridge.collective({})],
          wait
        )
      }

    return wait
  }
)