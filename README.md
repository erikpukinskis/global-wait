If you want to start multiple asynchronous processes from different places and then wait for them all to finish, **global-wait** can help.

Create a ticket that everyone else will wait on:

```javascript
var ticket = wait.start("pack up")
```

Then various people can wait for things to finish:

```javascript
wait(dontStray)
```

When you are done with your ticket, mark it finished:

```javascript
wait.finish(ticket)
```

And then your callback will be called:

```javascript
function dontStray() {
  console.log("They don't love you like i love you.")
}
```

If you want to wait on things to be finished in a different iframe:

```javascript

wait.forIframe(".my-iframe", function() {
  console.log("my frame finished!")
})
```
