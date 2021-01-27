var ENV = {};
if(typeof process !== 'undefined' && process.hasOwnProperty('env')) {
  ['CHECK_INTERVAL', 'DEBUG', 'SVG_FILE', 'SECRETS_DIR'].forEach(function(envName) {
    if(process.env.hasOwnProperty(envName)) {
      ENV[envName] = process.env[envName];
    }
  });
}

const config = {
  server: {
    svgFile: ENV.SVG_FILE ? ENV.SVG_FILE : './svg-image/test.svg',
    secretsDir: ENV.SECRETS_DIR ? ENV.SECRETS_DIR : '/run/secrets',
    httpPort: 19000,
    wsPort: 19001,
    checkInterval: ENV.CHECK_INTERVAL ? ENV.CHECK_INTERVAL : 30000,
    debug: ENV.DEBUG ? true : false
  },
  client: {
    wsPort: 19001,
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

