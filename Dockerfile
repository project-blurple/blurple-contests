# compile typescript to normal javascript

FROM node:18-alpine@sha256:8f98aac3c42ceda6c42b8d34c7ea3ad5317ff340209557d0ee1da224dd244d3a AS builder
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY ./src ./src
RUN npm run build


# production image

FROM node:18-alpine@sha256:8f98aac3c42ceda6c42b8d34c7ea3ad5317ff340209557d0ee1da224dd244d3a AS final
RUN apk --no-cache add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY .env ./.env
COPY --from=builder /app/build ./build

CMD ["dumb-init", "npm", "start"]