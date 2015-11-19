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
