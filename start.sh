#!/usr/bin/env sh

if [[ "${WS_URL}" ]]; then
  DOCKER_WS_URL_CONFIG="<script>var WS_URL=\'$WS_URL\';</script>"

  CONFIG_FILE=/app/src/index.html
  sed -i 's@<!--DOCKER_WS_URL_CONFIG-->@'"$DOCKER_WS_URL_CONFIG"'@' "$CONFIG_FILE"
fi

npm start
