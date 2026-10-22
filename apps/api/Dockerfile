# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/domain packages/domain
COPY packages/eslint-config packages/eslint-config
COPY packages/typescript-config packages/typescript-config
RUN pnpm --filter api... build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter api deploy --prod --legacy /output/api

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /output/api/package.json ./package.json
COPY --from=build --chown=node:node /output/api/node_modules ./node_modules
COPY --from=build --chown=node:node /output/api/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
