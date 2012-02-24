# Json RPC2 Server for nodejs

## Usage

```js
var rpc = require('choco-jsonrpc2');

var server = new rpc.Server();

/**
 * ping return pong
 */

/*
 * Describe the service
 * server.desc('ping', { myParam: "string" }, {}, "string");
 * server.desc('ping', { myParam: { type: "string", optional: "true" }}, { type: "string" });
 */
server.desc('ping', [], "string");

server.expose('ping', function(params, callback) {
    //...

    if (err) {
       return callback(-32000, 'ping failed'); // or callback(server.error_messages.INVALID_PARAMS);
    }

    callback(null, 'pong');
});

server.listen(3000, 'localhost');
```
