# compile typescript to normal javascript

FROM node:18-alpine@sha256:d7cdfa41eb67aef61d119f8579ca5f45e7ef285832a718599579b4b2a6e39ece AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:d7cdfa41eb67aef61d119f8579ca5f45e7ef285832a718599579b4b2a6e39ece AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]