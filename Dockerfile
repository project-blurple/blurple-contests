# compile typescript to normal javascript

FROM node:18-alpine@sha256:bc329c7332cffc30c2d4801e38df03cbfa8dcbae2a7a52a449db104794f168a3 AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:bc329c7332cffc30c2d4801e38df03cbfa8dcbae2a7a52a449db104794f168a3 AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]