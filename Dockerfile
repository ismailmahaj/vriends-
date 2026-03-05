FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances (utiliser npm install si package-lock.json n'est pas synchronisé)
RUN npm install

# Copier le reste du code
COPY . .

# Build l'application
RUN npm run build

# Stage de production
FROM node:20-alpine

WORKDIR /app

# Installer serve globalement
RUN npm install -g serve

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist ./dist

# Exposer le port (Railway assigne automatiquement via PORT)
EXPOSE 3000

# Démarrer serve avec le port depuis l'environnement
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
