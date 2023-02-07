FROM node:16

WORKDIR /usr/src/app

ADD service/ ./service

COPY package.json yarn.lock exobrain-util.js ./

RUN yarn install

CMD node exobrain-util.js -h