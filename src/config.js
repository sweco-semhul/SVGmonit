const config = {
  server:{
    svgFile: '/svg-image/test.svg',
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

