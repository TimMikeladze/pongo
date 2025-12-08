# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
FROM oven/bun:slim AS base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Install system dependencies
FROM base AS deps-system

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*


# Install node modules
FROM deps-system AS deps

COPY bun.lock package.json ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile


# Copy pongo config (separate layer for config changes)
FROM deps AS pongo-config

COPY pongo ./pongo


# Build application
FROM pongo-config AS build

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=cache,target=/app/.next/cache \
    bun next build


# Production dependencies only
FROM deps-system AS production-deps

COPY bun.lock package.json ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile


# Final stage for app image
FROM base

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy pongo config
COPY --from=pongo-config /app/pongo ./pongo

# Copy built application
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.sqlite.ts ./
COPY --from=build /app/docker-entrypoint.js ./

# Entrypoint sets up the container.
ENTRYPOINT [ "/app/docker-entrypoint.js" ]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "run", "start" ]
