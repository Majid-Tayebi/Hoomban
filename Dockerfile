# Hoomban — SvelteKit (adapter-node) production image
# Code-only rebuilds reuse cached npm layers (do NOT use --no-cache).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts

FROM deps AS build
COPY . .
ARG PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
ARG PUBLIC_APP_URL=http://127.0.0.1:3000
ENV PUBLIC_POCKETBASE_URL=$PUBLIC_POCKETBASE_URL \
    PUBLIC_APP_URL=$PUBLIC_APP_URL \
    POCKETBASE_URL=http://127.0.0.1:8090
RUN npx svelte-kit sync && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
USER node
EXPOSE 3000
CMD ["node", "build"]
