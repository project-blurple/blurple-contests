FROM node:18-alpine@sha256:3120b21ed49333280d78dfe44b6eabc25c3309c3366bbcfa409b804334fd16ab AS base
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
