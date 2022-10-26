# compile typescript to normal javascript

FROM node:18-alpine@sha256:d1f183e67fdb22c1208bd9f20d498cd2a4dbfc79ac5a72865162fc0bf7ca966c AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:d1f183e67fdb22c1208bd9f20d498cd2a4dbfc79ac5a72865162fc0bf7ca966c AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]