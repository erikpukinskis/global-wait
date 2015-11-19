var test = require("nrtv-test")(require)

test.using(
  "wait for someone else to finish",
  ["./"],
  function(expect, done, wait) {
    var id = wait("start")
    var otherId = wait("start")
    var document = wait.mockDocument

    wait(document, function() {
      expect(oneFinishedAlready).to.be.true
      done()
    })

    wait("done", id)

    var oneFinishedAlready = true

    wait("done", otherId)
  }
)


test.using(
  "works in the browser",
  ["./", "nrtv-browse", "nrtv-server", "nrtv-browser-bridge", "nrtv-make-request"],
  function(expect, done, wait, browse, server, bridge, makeRequest) {

    var startAndFinish = bridge.defineFunction(
      [wait.defineInBrowser()],
      function(wait) {
        var id = wait("start")
        setTimeout(wait.bind(null, "done", id))
      }
    )

    server.addRoute("get", "/finish", 
      function() { shutItDown() }
    )

    var tellServerItsDone = makeRequest.defineInBrowser().withArgs("/finish") 

    var waitForIt = bridge.defineFunction(
      [wait.defineInBrowser(), tellServerItsDone],
      function(wait, tellServerItsDone) {
        wait(tellServerItsDone)
      }
    )

    bridge.asap(startAndFinish)
    bridge.asap(waitForIt)

    server.addRoute("get", "/", bridge.sendPage())

    server.start(8384)

    var shutItDown

    browse("http://localhost:8384",
      function(browser) {
        shutItDown = function() {
          browser.done()
          server.stop()
          done()
        }
      }
    )
  }
)