var statusElementId = 'status';
var svgElementId = 'svg-image';
var statusQueue = [];


function generateStatusStr(code, check, name, msg) {
  let errorClass = '';
  if(code > 498) {
    errorClass =  ' class="error"';
  } else if (code > 299) {
    errorClass =  ' class="warning"';
  }
  let now = (new Date()).toISOString();
  let checkStr = check ? ('<a href="' + check + '" target="_blank">' + name + '</a>') : name;
  let msgStr = msg || '';
  return '<span' + errorClass + '>' + now + ' ' + code + ' ' + checkStr + ' ' + msgStr + '</span>';
}

function printStatus(code, check, name, msg) {
  statusQueue.unshift(generateStatusStr(code, check, name, msg));
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
  if(jsonMsg.last.statusCode < 400) {
    color = config.client.color.ok;
  } else if (jsonMsg.last.statusCode < 499) {
    color = config.client.color.warning;
  } else {
    color = config.client.color.error;
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
    tooltip.children[0].getElementsByTagName('text')[0].innerHTML = encodeURIComponent(jsonMsg.name + ' ' + jsonMsg.last.when + ' ' + statusMsg);

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

function parseError(lastMessage) {
  if(lastMessage.hasOwnProperty('error') && lastMessage.error != null) {
    return JSON.stringify(lastMessage.error);
  }
  return '';
}

function initWS() {
  var wsUrl =  'ws://' + window.location.hostname + ':' +  config.client.wsPort;
  var ws = new WebSocket(wsUrl);

  // Bind to web socket events
  ws.onclose   = function(event) { printStatus(500, null, 'Web socket', 'connection closed'); }
  ws.onerror   = function(event) { printStatus(500, null, JSON.stringify(event,0,2)); }
  ws.onopen    = function(event) { printStatus(200, null, 'Web socket', 'connected to server at ' + wsUrl); };
  ws.onmessage = function(event) { 
    var jsonMessage = JSON.parse(event.data);
    // TODO! create a better message format
    // First message will be all checks
    if(Array.isArray(jsonMessage)) { 
      jsonMessage.forEach(function(message) {
        message.url.split('\/\/')
        if(message.last) {
          printStatus(message.last.statusCode, message.last.url, message.name, parseError(message.last) );
          updateSVG(message, true);
        }
      });
    } else {  
      // Set status and update svg
      printStatus(jsonMessage.last.statusCode, jsonMessage.last.url, jsonMessage.name, parseError(jsonMessage.last) );
      updateSVG(jsonMessage);
    }
  }
}

// Connect to web socket when page has loaded
window.onload = function() {
  initWS();
}
    