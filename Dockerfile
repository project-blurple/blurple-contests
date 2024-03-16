FROM node:18-alpine@sha256:f75c64adb043039b3e37573ed709ca3a6f822f20eb7895966ebf14d677f01bc7 AS base
RUN apk --no-cache add g++ gcc make python3

WORKDIR /app
ENV IS_DOCKER=true


# base image for package installation

FROM base AS dep-base
RUN npm install -g pnpm@8

COPY package.json ./
COPY pnpm-lock.yaml ./


# install production dependencies

FROM dep-base AS prod-deps
RUN pnpm install --frozen-lockfile --prod


# install all dependencies and build typescript

FROM prod-deps AS ts-builder
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY ./src ./src
RUN pnpm run build


# production image

FROM base

COPY .env* ./
COPY --from=ts-builder /app/build ./build
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production
ENTRYPOINT [ "npm", "run" ]
CMD [ "start" ]
