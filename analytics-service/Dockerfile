# ============================================================
# Stage 1: Build dependencies
# ============================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for build-time checks)
RUN npm ci

# Copy all source code
COPY . .

# ============================================================
# Stage 2: Production image
# ============================================================
FROM node:18-alpine

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy only source code (no node_modules from builder)
COPY --from=builder /app/src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Cloud Run requires this exact port
ENV PORT=8080
EXPOSE 8080

# Health check (optional, good practice)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the app
CMD ["npm", "start"]
