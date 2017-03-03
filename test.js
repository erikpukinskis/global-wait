var runTest = require("run-test")(require)

runTest.failAfter(3000)

runTest(
  "shares state between frames",
  ["./", "browser-task", "web-site", "browser-bridge", "make-request", "web-element"],
  function(expect, done, wait, browse, WebSite, BrowserBridge, makeRequest, element) {

    // Inner frame

    var frame = new BrowserBridge()
    var site = new WebSite()

    site.addRoute("get", "/finish-work",
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

    site.addRoute("get", "/frame", frame.requestHandler(element("frame")))


    // Page

    var bridge = new BrowserBridge()

    site.addRoute("get", "/done-waiting",
      function(request, response) {
        response.send("boo ya")
        haveExpectations()
      }
    )

    var stopWaiting = makeRequest.defineOn(bridge).withArgs("/done-waiting") 

    var waitForIt = bridge.defineFunction(
      [wait.defineOn(bridge), stopWaiting],
      function(wait, stopWaiting) {
        var iframe = document.querySelector("iframe")
        wait.forIframe(iframe, stopWaiting)
      }
    )

    bridge.asap(waitForIt)

    var iframe = element("iframe", {src: "/frame"})

    site.addRoute("get", "/", bridge.requestHandler(iframe))

    site.start(8384)

    var browser = browse("http://localhost:8384")

    function haveExpectations() {
      expect(work).to.equal("finished")
      browser.done()
      site.stop()
      done()
    }

  }
)