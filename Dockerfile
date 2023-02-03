# compile typescript to normal javascript

FROM node:18-alpine@sha256:2ec9ffe15b8f2c0b14fc19c86dc765c625c45d52cb84fa5e36b8926c62feb4ae AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:2ec9ffe15b8f2c0b14fc19c86dc765c625c45d52cb84fa5e36b8926c62feb4ae AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]