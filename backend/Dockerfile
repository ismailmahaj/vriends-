FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package (depuis le contexte backend/)
COPY package*.json ./

# Installer les dépendances (utiliser npm install si package-lock.json n'est pas synchronisé)
RUN npm install --production

# Copier le reste du code
COPY . .

# Créer le dossier db s'il n'existe pas
RUN mkdir -p /app/db

# Exposer le port
EXPOSE 3001

# Démarrer l'application directement avec node
CMD ["node", "server.js"]
