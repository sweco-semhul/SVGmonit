const fs = require('fs');
const xml2js = require('xml2js');
const connect = require('connect');
const serveStatic = require('serve-static');
const request = require('request');
const WebSocket = require('ws');
const config = require('./config').config;
var path = require('path');
const SECRETS_DIR = '/run/secrets';
const SECRETS = readSecrets(); 

var checks = [];

// Mock websocket server send to client, before any client has connected
var CLIENTS = [];

// Websocket server
const wss = new WebSocket.Server({ port: config.server.wsPort })
// When a connection is made set that socket as correct one
// This means that only the last connection will be used!
wss.on('connection', ws => {
  CLIENTS.push(ws);
  // Send checks to client
  sendAll(JSON.stringify(checks));
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
          url: parseKey(checkSrc[1]),
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

    // Start running checks
    check(checks);
    setInterval(function() { check(checks); }.bind(this), config.server.checkInterval);
  });
});

// Parse {*.APIKEY} and replace it with docker secret
function parseKey(url) {
  let apiKeyNames = url.match(/{.*APIKEY}/);
  if(apiKeyNames && apiKeyNames.length > 0) {
    let apiKeyName = apiKeyNames[0].replace(/{|}/g,'');
    console.log('Found key', apiKeyName , 'in url', url);
    let secret = SECRETS[apiKeyName];
    if(secret) {
      url = url.replace('{'+apiKeyName+'}', secret);
    } else {
      console.warn('Secret',apiKeyName,'not found');
    }
  }
  return url;
}

// Read docker secrets file
function readSecrets() {
  const secrets = {};
  console.log(SECRETS_DIR);
  if (fs.existsSync(SECRETS_DIR)) {
    try {
      const files = fs.readdirSync(SECRETS_DIR);

      files.forEach(function(file) {
        const fullPath = path.join(SECRETS_DIR, file);
        try {
          const data = fs.readFileSync(fullPath, 'utf8').toString().trim();
          secrets[file] = data;
        } catch (err) {
          console.error('Failed to parse secret', err);
        }
      });
    } catch (err) {
      console.log('Failed to read secrets', err);
    }
  }
  return secrets;
}


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
      statusCode: response ? response.statusCode : 418
    };
    if(config.server.debug) {
      console.log(check.last);
    }
    // Send to the client
    sendAll(JSON.stringify(check));
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
      next();
    })
    .use(serveStatic(__dirname))
    .listen(config.server.httpPort, () => console.log('Server running on port ' + config.server.httpPort));
  
}

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

// Send to all clients
function sendAll(msg) {
  CLIENTS.forEach(ws => {
    ws.send(msg);
  });
}