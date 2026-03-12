# Dockerfile para Astro en Raspberry Pi
FROM node:20-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 4321

# Variable de entorno para producción
ENV HOST=0.0.0.0
ENV PORT=4321

# Comando para iniciar la aplicación
CMD ["node", "./dist/server/entry.mjs"]
