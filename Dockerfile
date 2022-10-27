# compile typescript to normal javascript

FROM node:18-alpine@sha256:2f39bedbfafae29ffc6ccab5ec5a4fd3fba5b9823eaf3f78a4cc20d70c39b470 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:2f39bedbfafae29ffc6ccab5ec5a4fd3fba5b9823eaf3f78a4cc20d70c39b470 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]