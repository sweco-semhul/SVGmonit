var statusElementId = 'status';
var svgElementId = 'svg-image';
var statusQueue = [];


function setStatus(code, check, name, msg) {
  statusQueue.unshift('<span' + (code < 498 ? '' : ' class="error"') + '>' + (new Date()).toISOString() + ' ' + code + ' ' + (check ? ('<a href="' + check + '" target="_blank">' + name + '</a>') : '') + msg + '</span>');
  document.getElementById(statusElementId).innerHTML = statusQueue.join('<br>');
  if(statusQueue.length > 100) {
    statusQueue.pop();
  }
}

function updateSVG(jsonMsg, addEventListener) {
  console.log(jsonMsg);

  var a = document.getElementById(svgElementId);
  // Get inner svg doc
  var svgDoc = a.contentDocument;

  // Change color of linked element
  var color;
  switch (jsonMsg.last.statusCode) {
    case 200:
      color = config.client.color.ok;
      break;
    case 404:
      color = config.client.color.notOk;
      break;
    default:
      color = config.client.color.notOk;
      break;
  }
  var svgElement = svgDoc.getElementById(jsonMsg.id);
  if(svgElement) {
    svgElement.children[0].setAttribute('fill', color);
    svgElement.children[0].setAttribute('stroke', color);

    // Change tooltip content
    var tooltip = svgDoc.getElementById('tooltip.'+jsonMsg.id);
    var statusMsg = '';
    if(jsonMsg.last.error) {
      statusMsg = jsonMsg.last.error.code + ' ' + jsonMsg.last.error.errno;
    } else {
      statusMsg = jsonMsg.last.statusCode + ' ' + jsonMsg.last.requestTime + 'ms';
    }
    tooltip.children[0].getElementsByTagName('text')[0].innerHTML = jsonMsg.name + ' ' + jsonMsg.last.when + ' ' + statusMsg;

    if(addEventListener) {
      // Add link from check
      svgElement.setAttribute('check-link', jsonMsg.last.url);
      svgElement.style.cursor = 'pointer';
      svgElement.addEventListener('click', function(event) {
        window.open(event.currentTarget.getAttribute('check-link'), '_blank');
      });
    }
    
  } else {
    console.error('SVG element', jsonMsg.id, 'not found');
  }

  //debugger;
}


function initWS() {
  var wsUrl =  'ws://' + window.location.hostname + ':' +  config.client.wsPort;
  var ws = new WebSocket(wsUrl);

  // Bind to web socket events
  ws.onclose   = function(event) { setStatus(500, null, 'Web socket connection closed'); }
  ws.onerror   = function(event) { setStatus(500, null, JSON.stringify(event,0,2)); }
  ws.onopen    = function(event) { setStatus(200, null, 'WebSocket connected to server at ' + wsUrl); };
  ws.onmessage = function(event) { 
    var jsonMessage = JSON.parse(event.data);
    // TODO! create a better message format
    // First message will be all checks
    if(Array.isArray(jsonMessage)) { 
      jsonMessage.forEach(function(message) {
        message.url.split('\/\/')
        if(message.last) {
          setStatus(message.last.statusCode, message.last.url, message.name, ' updated. ' + (JSON.stringify(message.last.error) || '') );
          updateSVG(message, true);
        }
      });
    } else {  
      // Set status and update svg
      setStatus(jsonMessage.last.statusCode, jsonMessage.last.url, jsonMessage.name, ' updated. ' + (JSON.stringify(jsonMessage.last.error) && jsonMessage.last.error.code || '') );
      updateSVG(jsonMessage);
    }
  }
}

// Connect to web socket when page has loaded
window.onload = function() {
  initWS();
}
    