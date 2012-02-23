# Json RPC2 Server for nodejs


## Usage

```js
var rpc = require('jsonrpc2');

var server = new rpc.Server();

/**
 * ping return pong
 */
server.expose('ping', function(params, callback) {
    //...
    
    if (err) {
       return callback(-32000, 'ping failed'); // or callback(server.error_messages.INVALID_PARAMS);
    }
 
    callback(null, 'pong');
});

server.listen(3000, 'localhost');
```