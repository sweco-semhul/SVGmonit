var statusElementId = 'status';
var svgElementId = 'svg-image';

var ws = new WebSocket(config.client.wsUrl);

function setStatus(status) {
  document.getElementById(statusElementId).innerHTML = (new Date()).toISOString() + ' ' + status;
}

function updateSVG(jsonMsg) {
  console.log(jsonMsg);

  var a = document.getElementById(svgElementId);
  // Get inner svg doc
  var svgDoc = a.contentDocument;

  // Change color of linked element
  var color = jsonMsg.last.statusCode === 200 ? config.client.color.ok : config.client.color.notOk;
  var svgElement = svgDoc.getElementById(jsonMsg.id);
  svgElement.children[0].setAttribute('fill', color);
  svgElement.children[0].setAttribute('stroke', color);

  // Change tooltip content
  var tooltip = svgDoc.getElementById('tooltip.'+jsonMsg.id);
  tooltip.children[0].getElementsByTagName('text')[0].innerHTML = jsonMsg.name + ' ' + jsonMsg.last.when + ' ' + jsonMsg.last.statusCode + ' ' + jsonMsg.last.requestTime + 'ms';
}

// Bind to web socket events
ws.onclose   = function(event) { setStatus('Web socket connection closed'); }
ws.onerror   = function(event) { setStatus(JSON.stringify(event,0,2)); }
ws.onopen    = function(event) { setStatus('WebSocket connected to server at ' + config.client.wsUrl); };
ws.onmessage = function(event) { 
  var jsonMessage = JSON.parse(event.data);
  // Set status and update svg
  setStatus(jsonMessage.name + ' updated. ' + jsonMessage.last.statusCode );
  updateSVG(jsonMessage); 
}
