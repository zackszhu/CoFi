# Dockerfile for Next.js project with pnpm - Optimized 3-stage build

# ---- Dependencies ----
FROM node:alpine AS deps

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM deps AS builder

# Build arguments for configuration
ARG PORT=3000
ARG NODE_ENV=production

WORKDIR /app

# Copy dependency definition files and install all dependencies (including devDependencies)
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN pnpm build

# ---- Runner ----
FROM node:alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite and set permissions
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/cofi.config.yaml ./cofi.config.yaml

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use the standalone server
CMD ["node", "server.js"]
