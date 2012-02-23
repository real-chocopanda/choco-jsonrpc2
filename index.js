var sys = require('sys');
var http = require('http');

function JsonRPCServer() {
    this.functions = [];
    this.server = this.createServer();
    this.error_messages = {
        POST_REQUIRED: { code: -32700, message: 'Post required.' },
        PARSE_ERROR: { code: -32700, message: 'Parse error.' },
        INVALID_REQUEST: { code: -32600, message: 'Invalid Request.' },
        METHOD_NOT_FOUND: { code: -32601, message: 'Method not found.' },
        INVALID_PARAMS: { code: -32602, message: 'Invalid params.' },
        INTERNAL_ERROR: { code: -32602, message: 'Internal error.' }
      //  -32099..-32000  User error. 
    };
};

/**
 * Enable a new method
 * 
 * server.expose('ping', function(callback) {
 *   //....
 *   
 *   if (err) {
 *      return callback(-32000, 'ping failed'); // or callback(server.error_messages.INVALID_PARAMS);
 *   }
 *   
 *   callback(null, 'pong');
 * });
 *
 * @param name
 * @param callack
 */
JsonRPCServer.prototype.expose = function (name, callack) {
    this.trace('***', 'exposing: ' + name);
    this.functions[name] = callack;  
};

/**
 * To ease output of logs
 * 
 * @param direction
 * @param message
 */
JsonRPCServer.prototype.trace = function (direction, message) {
    sys.puts('   ' + direction + '   ' + message);
};

/**
 * Start listenning http queries
 * 
 * @param port
 * @param host
 */
JsonRPCServer.prototype.listen = function(port, host) {
    this.server.listen(port, host);
    this.trace('***', 'Server listening on http://' + (host || '127.0.0.1') + ':' + port + '/');
};

/**
 * Create an http server
 * 
 * @return httpServer
 */
JsonRPCServer.prototype.createServer = function () {
    JsonRPCServer = this;
    return http.createServer(function(req, res) {
        JsonRPCServer.handleRequest(req, res);
    });
};

/**
 * Analyse the httpQuery
 * 
 * @param req ServerRequest
 * @param res ServerResponse
 */
JsonRPCServer.prototype.handleRequest = function(req, res) {
    this.trace('<--', 'accepted request');

    if(req.method === 'POST') {
        this.handlePOST(req, res);
    }
    else {
        this.handleNonPOST(req, res);
    }
};

/**
 * Called for non post request
 * 
 * @param req ServerRequest
 * @param res ServerResponse
 */
JsonRPCServer.prototype.handleNonPOST = function(req, res) {
    JsonRPCServer.sendError({ id: null }, JsonRPCServer.error_messages.POST_REQUIRED, res);
};

/**
 * Analyse and execute the post request
 * 
 * @param req ServerRequest
 * @param res ServerResponse
 */
JsonRPCServer.prototype.handlePOST = function(req, res) {
    var buffer = '';
    req.addListener('data', function(data) {
        buffer += data;
    });
    
    req.addListener('end', function(data) {
        var decoded = JSON.parse(buffer);

        if(!(decoded.method && decoded.params && decoded.id != 'undefined')) {
            return JsonRPCServer.sendError(decoded, JsonRPCServer.error_messages.INVALID_REQUEST, res);
        }
        
        if(!JsonRPCServer.functions.hasOwnProperty(decoded.method)) {
            return JsonRPCServer.sendError(decoded, JsonRPCServer.error_messages.METHOD_NOT_FOUND, res);
        }
        
        method = JsonRPCServer.functions[decoded.method];
        
        return method(decoded.params, function(err, result) {
            if (err) {
                if ('object' == typeof(err)) {
                    return JsonRPCServer.sendError(decoded, err, res); 
                }
                
                return JsonRPCServer.sendError(decoded, { code: err, message: result }, res);
            }
            
            return JsonRPCServer.sendResponse(res, {
                "result": result,
                "id": decoded.id || null
            });
            
        });
    });
    
};

/**
 * Format a response error JsonRPCServer2 message
 * 
 * @param decoded the decoded query to get the id
 * @param params an object with error code and error message
 * @param res ServerResponse the response object 
 */
JsonRPCServer.prototype.sendError = function(decoded, params, res) {
    this.sendResponse(res, {
        "error": {
            "code": params.code,
            "message": params.message
        },
        "id": decoded.id || null
    });
};

/**
 * Send a json response 
 * 
 * @param res ServerResponse The ServerResponse
 * @param object object to encode in json
 * @param statusCode an http status default 200
 */
JsonRPCServer.prototype.sendResponse = function(res, object, statusCode) {
    object.jsonrpc = "2.0";
    
    var content = JSON.stringify(object);

    res.writeHead(statusCode || 200, {
        'Content-Type': 'application/json',
        'Content-Length': content.length,
        'Allow': 'POST'
    });

    res.write(content);
    res.end();
};

exports.Server = function () {
    return new JsonRPCServer();
};