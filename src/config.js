const config = {
  server: {
    svgFile: '/svg-image/test.svg',
    httpPort: 3000,
    wsPort: 8080,
    checkInterval: 5000
  },
  client: {
    wsUrl: 'ws://localhost:8080',
    color: {
      ok: 'lime',
      notOk: 'red'
    }
  }
};

if(typeof exports !== 'undefined') {
  exports.config = config;
}

