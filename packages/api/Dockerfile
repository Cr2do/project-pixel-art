# Contexte de build = racine du monorepo
# docker build -f packages/api/Dockerfile .

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copie le lockfile racine + le package.json du workspace api
COPY package.json ./
COPY packages/api/package.json ./packages/api/

# Installe les dépendances du workspace api (hoistées dans /app/node_modules)
RUN npm install -w packages/api

# Copie les sources de l'api
COPY packages/api/ ./packages/api/

# Compile TypeScript
RUN cd packages/api && npx tsc

# Supprime les devDependencies
RUN npm prune --omit=dev

# Stage 2: Run
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# node_modules hoistées à la racine + dist compilé
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/dist ./dist

EXPOSE 8000

CMD ["node", "dist/index.js"]
