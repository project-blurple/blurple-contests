# compile typescript to normal javascript

FROM node:18-alpine@sha256:7bd754b52b9a2634a5060b4f737409a3e771b5d062e2e860b9c74363614759e2 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:7bd754b52b9a2634a5060b4f737409a3e771b5d062e2e860b9c74363614759e2 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]