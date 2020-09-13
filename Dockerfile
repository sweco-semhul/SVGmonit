FROM node:10.22-alpine

RUN apk add curl

WORKDIR /app

COPY . ./

RUN npm install

ENTRYPOINT [ "./start.sh" ]