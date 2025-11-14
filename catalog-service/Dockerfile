# ------------------------------
# Etapa de construcción
# ------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias (incluye dotenv porque está en package.json)
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# ------------------------------
# Imagen final (runtime)
# ------------------------------
FROM node:18-alpine
WORKDIR /app

# Copiar node_modules y código
COPY --from=builder /app /app

# Cloud Run establece su propio PORT
ENV NODE_ENV=production

# Exponer puerto (opcional)
EXPOSE 5234

# Comando de inicio
CMD ["npm", "start"]
