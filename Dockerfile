# compile typescript to normal javascript

FROM node:18-alpine@sha256:ae6cf743c4c290423e163d8a85db7a08b831aace7e2486e857147f78f0cc34d3 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:ae6cf743c4c290423e163d8a85db7a08b831aace7e2486e857147f78f0cc34d3 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]