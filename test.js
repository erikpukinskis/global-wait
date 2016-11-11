var test = require("nrtv-test")(require)

test.only("works in the browser")

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
  ["./", "nrtv-browse", "nrtv-server", "browser-bridge", "make-request"],
  function(expect, done, wait, browse, server, BrowserBridge, makeRequest) {

    // Inner frame

    var frame = new BrowserBridge()

    server.addRoute("get", "/finish-work",
      function(request, response) {
        work = "finished"
        response.send("ok")
      }
    )

    var finishWork = makeRequest.defineOn(frame).withArgs("/finish-work")

    var work = "work"

    frame.asap(
      frame.defineFunction(
        [wait.defineOn(frame), finishWork],
        function(wait, finishWork) {
          var ticket = wait("start")
          setTimeout(finishWork, 1000)
        }
      )
    )

    server.addRoute("get", "/frame", frame.sendPage())


    // Page

    var bridge = new BrowserBridge()

    server.addRoute("get", "/done-waiting",
      function() { haveExpectations() }
    )

    var stopWaiting = makeRequest.defineOn(bridge).withArgs("/done-waiting") 

    var waitForIt = bridge.defineFunction(
      [wait.defineOn(bridge), stopWaiting],
      function(wait, stopWaiting) {
        wait(stopWaiting)
      }
    )

    bridge.asap(waitForIt)

    server.addRoute("get", "/", bridge.sendPage())

    server.start(8384)

    var browser = browse("http://localhost:8384")

    function haveExpectations() {
      expect(work).to.equal("finished")
      browser.done()
      server.stop()
      done()
    }

  }
)