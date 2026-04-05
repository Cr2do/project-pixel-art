# React Project

Skeleton monorepo pour le projet MBDS 2025. Il contient deux packages :

- `packages/client` — frontend React + Vite
- `packages/api` — backend Express.js

## Installation

Dans le répertoire racine du projet :

```bash
npm install
```

## Lancer le projet

### Les deux en même temps (recommandé)

```bash
npm start
```

### Séparément (dans deux terminaux distincts)

```bash
npm start:client   # Lance le serveur de développement React (Vite)
npm start:api      # Lance le serveur Express
```

| Service | URL par défaut       |
| ------- | --------------------- |
| Client  | http://localhost:5173 |
| API     | http://localhost:8000 |

## Structure du projet

```
packages/
├── client/    
│   └── src/
│       ├── main.tsx
│       └── App.tsx
└── api/           # Express 4
    ├── index.ts       # Point d'entrée, configure le serveur
    ├── api.ts         # Routeur principal (/api)
    ├── routes/        # Définition des routes HTTP
    └── services/      # Logique métier
```

## Ajouter une dépendance

```bash
# Dépendance de production dans le client
npm install <package> --workspace=client

# Dépendance de production dans l'api
npm install <package> --workspace=api

# Dépendance de développement
npm install -D <package> --workspace=client
```

## Linter

```bash
npm run lint   # Vérifie client et api
```
