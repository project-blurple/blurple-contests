# compile typescript to normal javascript

FROM node:18-alpine@sha256:e94fd1fe17cc5bc2a50a022bdbb7ba08dfed0487bf1eade3e8a8d69ed6d2efbd AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:e94fd1fe17cc5bc2a50a022bdbb7ba08dfed0487bf1eade3e8a8d69ed6d2efbd AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]