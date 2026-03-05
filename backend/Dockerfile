FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances (utiliser npm install si package-lock.json n'est pas synchronisé)
RUN npm install --production

# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 3001

# Démarrer l'application directement avec node
CMD ["node", "server.js"]
