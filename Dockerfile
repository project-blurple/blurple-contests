# compile typescript to normal javascript

FROM node:18-alpine@sha256:acae2aba634ddedae8c3f4ca24b2430f271f59f8a7b36fff5b6600dbd4fef56c AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:acae2aba634ddedae8c3f4ca24b2430f271f59f8a7b36fff5b6600dbd4fef56c AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]