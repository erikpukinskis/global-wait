var test = require("nrtv-test")(require)

test.using(
  "shares state between frames",
  ["./", "nrtv-browse", "nrtv-server", "browser-bridge", "make-request", "web-element"],
  function(expect, done, wait, browse, server, BrowserBridge, makeRequest, element) {

    // Inner frame

    var frame = new BrowserBridge()

    server.addRoute("get", "/finish-work",
      function(request, response) {
        work = "finished"
        response.send("ok")
      }
    )

    var work = "work"

    frame.asap(
      frame.defineFunction(
        [wait.defineOn(frame), makeRequest.defineOn(frame)],
        function(wait, makeRequest) {
          var ticket = wait.start()
          setTimeout(function() {
            makeRequest("/finish-work")
            wait.finish(ticket)
          }, 1000)
        }
      )
    )

    server.addRoute("get", "/frame", frame.sendPage(element("frame")))


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

    var iframe = element("iframe", {src: "/frame"})

    bridge.asap(
      [wait.defineOn(bridge)],
      function(wait) {
        wait.shareWithIframe("iframe")
      }
    )

    server.addRoute("get", "/", bridge.sendPage(iframe))

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