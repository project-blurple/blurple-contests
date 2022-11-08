# compile typescript to normal javascript

FROM node:18-alpine@sha256:15fbd5cb2b65e4211c722e5b387cae920c6a4f558384a06957f86e5967dde074 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:15fbd5cb2b65e4211c722e5b387cae920c6a4f558384a06957f86e5967dde074 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]