# Stage 1: Build application
FROM node:20-slim AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /src

# Copy dependency manifests
COPY package.json pnpm-lock.yaml tsconfig.json nuxt.config.ts ./

# Install dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Copy application sources
COPY app/ ./app/
COPY server/ ./server/
COPY public/ ./public/

# Build production bundle
RUN pnpm build

# Stage 2: Runtime image
FROM node:20-slim AS runner

WORKDIR /app

# Copy output artifacts from builder
COPY --from=builder /src/.output ./.output

# Expose production port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start stateless Nitro server
CMD ["node", ".output/server/index.mjs"]
