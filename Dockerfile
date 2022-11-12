# compile typescript to normal javascript

FROM node:18-alpine@sha256:c7d45b801406fe733c5893c03dc47fd5fa703f37d6893f96c3acf38286bd88b0 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:c7d45b801406fe733c5893c03dc47fd5fa703f37d6893f96c3acf38286bd88b0 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]