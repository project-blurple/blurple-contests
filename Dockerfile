# compile typescript to normal javascript

FROM node:18-alpine@sha256:bec9006e7c419b8c9a40cd2049e7ec751f03cb7eacad73c69edfa8035e02b0ed AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:bec9006e7c419b8c9a40cd2049e7ec751f03cb7eacad73c69edfa8035e02b0ed AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]