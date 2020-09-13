var statusElementId = 'status';
var svgElementId = 'svg-image';


function setStatus(status) {
  document.getElementById(statusElementId).innerHTML = (new Date()).toISOString() + ' ' + status;
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
  var ws = new WebSocket(config.client.wsUrl);

  // Bind to web socket events
  ws.onclose   = function(event) { setStatus('Web socket connection closed'); }
  ws.onerror   = function(event) { setStatus(JSON.stringify(event,0,2)); }
  ws.onopen    = function(event) { setStatus('WebSocket connected to server at ' + config.client.wsUrl); };
  ws.onmessage = function(event) { 
    var jsonMessage = JSON.parse(event.data);
    // TODO! create a better message format
    // First message will be all checks
    if(Array.isArray(jsonMessage)) { 
      jsonMessage.forEach(function(message) {
        message.url.split('\/\/')
        setStatus(message.name + ' updated. ' + message.last.statusCode );
        updateSVG(message, true);
      });
    } else {
      // Set status and update svg
      setStatus(jsonMessage.name + ' updated. ' + jsonMessage.last.statusCode );
      updateSVG(jsonMessage);
    }
  }
}

// Connect to web socket when page has loaded
window.onload = function() {
  initWS();
}
