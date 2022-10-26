# compile typescript to normal javascript

FROM node:18-alpine@sha256:f20451e05fab16cf20447fd511b72402ce36e9dfb8292ef8c2be406969545f95 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:f20451e05fab16cf20447fd511b72402ce36e9dfb8292ef8c2be406969545f95 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]