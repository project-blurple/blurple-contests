# compile typescript to normal javascript

FROM node:18-alpine@sha256:c1685b20cb00ab488dd7c4371973a6f62fc831b765a2b00ea2500466f2a8e74e AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:c1685b20cb00ab488dd7c4371973a6f62fc831b765a2b00ea2500466f2a8e74e AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]