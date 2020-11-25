var ENV = {};
if(typeof process !== 'undefined' && process.hasOwnProperty('env')) {
  ['CHECK_INTERVAL', 'DEBUG'].forEach(function(envName) {
    if(process.env.hasOwnProperty(envName)) {
      ENV[envName] = process.env[envName];
    }
  });
}

const config = {
  server: {
    svgFile: '/svg-image/test.svg',
    httpPort: 3000,
    wsPort: 3001,
    checkInterval: ENV.CHECK_INTERVAL ? ENV.CHECK_INTERVAL : 30000,
    debug: ENV.DEBUG ? true : false
  },
  client: {
    wsPort: 3001,
    color: {
      ok: 'lime',
      noResponse: 'orange',
      notOk: 'red'
    }
  }
};

if(typeof exports !== 'undefined') {
  exports.config = config;
}

