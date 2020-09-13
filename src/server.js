const fs = require('fs');
const xml2js = require('xml2js');
const connect = require('connect');
const serveStatic = require('serve-static');
const request = require('request');
const WebSocket = require('ws');
const config = require('./config').config;
 
// Travers nested js-object, use finder method to check all items on the object, apply changer when finder returns true 
function find(o, finder, changer) {
  if( finder(o) ){
    changer(o);
  }
  var result, p; 
  for (p in o) {
      if( o.hasOwnProperty(p) && typeof o[p] === 'object' ) {
          result = find(o[p], finder, changer);
          if(result){
              return result;
          }
      }
  }
  return result;
}

var checks = [];

// Mock websocket server send to client, before any client has connected
var ws = {
  send: function() {}
}

// Websocket server
const wss = new WebSocket.Server({ port: config.server.wsPort })
// When a connection is made set that socket as correct one
// This means that only the last connection will be used!
wss.on('connection', _ws => {
  ws = _ws;
});

// Parse the SVG image
var parser = new xml2js.Parser();
fs.readFile(__dirname + config.server.svgFile, function (err, data) {
  if(err) {
    console.log(err);
  }
  parser.parseString(data, function (err, result) {
    // Find CHECKS in the SVG 
    find(result.svg.g, function (o) {
      return o.hasOwnProperty('g') && o.g[0].hasOwnProperty('text') && o.g[0].text.find(i => i._.includes('CHECK'));
    }, function (o) {
      // Find url and name and parse linked svg item id
      let checkSrc = o.g[0].text[0]._.split('|');
      if(checkSrc.length > 0) {
        let check = {
          name: checkSrc[1].split('//')[1].split('?')[0],
          url: checkSrc[1],
          id: o.$.id.replace('tooltip.', '')
        };
        checks.push(check);
        o.g[0].text[0]._ = check.url;
      } else {
        console.error('Failed to parse check url for', checkSrc);
      } 
    });
    console.log('Checks parsed from SVG-image:');
    console.log(checks);

    // Build SVG from JS-object
    var builder = new xml2js.Builder();
    var svg = builder.buildObject(result);
    // Serve SVG image
    serv(svg);
    
    // Send checks to client
    ws.send(JSON.stringify(checks));

    // Start running checks
    check(checks);
    setInterval(function() { check(checks); }.bind(this), config.server.checkInterval);
  });
});


// Make a GET-request to check if the service is up
function ping(check) {
  request.get({
    url: check.url,
    time : true,
    timeout: config.server.checkInterval - 10
  }, function (error, response, body) {
    // Store last check information on the check
    check.last = {
      url: check.url,
      headers: response ? response.headers : {},
      when: new Date(),
      requestTime: response ? response.elapsedTime : -1,
      error: error,
      statusCode: response ? response.statusCode : {}
    };
    if(config.server.debug) {
      console.log(check.url, check.last);
    }
    // Send to the client
    ws.send(JSON.stringify(check));
  });

}

// Perform check on checks passed
function check(checks) {
  checks.forEach(c => {
    ping(c);
  });
}

function serv(svg) {

  // HTTP Server
  connect()
    .use('/svg', function fooMiddleware(req, res, next) {
      res.end(svg);
      // req.url starts with "/foo"
      next();
    })
    .use(serveStatic(__dirname))
    .listen(config.server.httpPort, () => console.log('Server running on port ' + config.server.httpPort));
  
}