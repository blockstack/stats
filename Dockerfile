FROM node:12.16.1-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json yarn.lock lerna.json /usr/src/app/
RUN yarn
COPY . /usr/src/app/
RUN yarn bootstrap
RUN yarn build

ENV NODE_ENV="production"
EXPOSE 5555
CMD ["yarn", "start:server"]
