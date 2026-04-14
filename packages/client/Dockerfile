# Contexte de build = racine du monorepo
# docker build -f packages/client/Dockerfile .

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copie le lockfile racine + le package.json du workspace client
COPY package.json ./
COPY packages/client/package.json ./packages/client/

# Installe les dépendances du workspace client (inclut devDeps pour Vite)
RUN npm install -w packages/client

# Copie les sources du client
COPY packages/client/ ./packages/client/

# Build avec placeholder — remplacé au démarrage du conteneur via entrypoint.sh
RUN cd packages/client && VITE_API_URL=__VITE_API_URL__ npm run build

# Stage 2: Serve
FROM nginx:alpine AS server

COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY packages/client/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
