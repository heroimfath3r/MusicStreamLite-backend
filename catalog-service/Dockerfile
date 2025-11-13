# Dockerfile para el microservicio de catálogo de música
# ------------------------------
# Etapa de construcción
# ------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# ------------------------------
# Etapa final (runtime)
# ------------------------------
FROM node:18-alpine
WORKDIR /app

# Copiar desde builder
COPY --from=builder /app /app

# Establecer variable de entorno para producción
ENV NODE_ENV=production

# Instalar dotenv para leer variables
RUN npm install dotenv

# Exponer el puerto que Cloud Run usa
EXPOSE 8080

# Comando de inicio
CMD ["npm", "start"]
