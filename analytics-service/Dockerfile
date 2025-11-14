# analytics-service/Dockerfile
# ✅ DOCKERFILE OPTIMIZADO PARA ANALYTICS (FIRESTORE)

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Instalar TODAS las dependencias (incluye morgan y otras)
RUN npm ci

COPY . .

# ==============================================================
# ETAPA 2: RUNTIME
# ==============================================================
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copiar node_modules pre-instalados del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 8080

CMD ["npm", "start"]