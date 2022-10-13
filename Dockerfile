FROM node:16-alpine@sha256:eb64e214569dde8684f80fcb515d6ab50148137449308f178db8ab5566cde0c3
RUN apk add dumb-init g++ gcc make python3

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . ./
RUN npm run build

CMD ["dumb-init", "npm", "start"]