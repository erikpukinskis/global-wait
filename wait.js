var library = require("module-library")(require)

module.exports = library.export(
  "nrtv-wait",
  function() {

    var generator = function() {


      // Each window and CommonJS instance has its own context.

      function WaitContext() {
        this.work = {}
        this.waiting = []
        this.timeoutIsSet = false
      }

      function tryToFinish() {
        for(key in this.work) {
          return
        }

        var callback = this.waiting.shift()

        if (callback) { callback()}

        if (this.waiting.length > 0) {
          this.checkInABit()
        }
      }

      WaitContext.prototype.wait = function(callback) {
        if (typeof callback != "function") {
          console.log(callback)
          throw new Error(callback+" is not a callback")
        }
        this.waiting.push(callback)
        this.checkInABit()
      }

      WaitContext.prototype.checkInABit = function() {
        setTimeout(tryToFinish.bind(this))
      }

      WaitContext.prototype.start = function pause(description) {
          var id = this.uniqueId()
          this.work[id] = description || "unknown"
          return id
        }

      WaitContext.prototype.uniqueId = function uniqueId() {
        do {
          var id = "wait4"+Math.random().toString(36).split(".")[1]
        } while(this.work[id])

        return id
      }

      WaitContext.prototype.finish = function finish(id) {
          delete this.work[id]
          this.checkInABit()
        }


      // Figure out the context:

      if (typeof window == "undefined") {
        var context = new WaitContext()
      } else {
        var context = window.__nrtvWaitContext || new WaitContext()

        window.__nrtvWaitContext = context
      }


      // Build a singleton:

      var wait = context.wait.bind(context)

      wait.start = context.start.bind(context)

      wait.finish = context.finish.bind(context)

      wait.forIframe = function(frame, callback, count) {

        var context = frame.contentWindow.__nrtvWaitContext
        var body = frame.contentDocument.body
        var isLoaded = body && !!body.innerHTML

        if (!count) {
          count = 1
        } else if (count > 20) {
          throw new Error("Trying to wait on an iframe but it took too long")
        } else {
          count++
        }

        if (context) {
          context.wait(callback)
        } else if (isLoaded && !context) {
          callback()
        } else {
          setTimeout(wait.forIframe.bind(null, frame, callback, count), delay(count))
        }

      }

      function delay(count) {
        if (!count) {
          return undefined
        } else if (count < 10) {
          return 0
        } else if (count < 20) {
          return 200
        } else if (count < 30) {
          return 500
        } else {
          return 2000
        }
      }

      return wait
    }



    // Get a singleton to export in Node:

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
