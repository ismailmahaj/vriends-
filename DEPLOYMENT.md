# Guide de Déploiement - Vriends Poperinge

Ce guide explique comment déployer le frontend et le backend en production.

## Options de Déploiement

### Option 1 : Railway (Recommandé - Simple et gratuit)
### Option 2 : Render (Gratuit avec limitations)
### Option 3 : Vercel (Frontend) + Railway/Render (Backend)
### Option 4 : VPS (Contrôle total)

---

## 🚂 OPTION 1 : RAILWAY (Recommandé)

Railway permet de déployer facilement les deux parties.

### Backend sur Railway

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Créer un nouveau projet** :
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Connectez votre repository GitHub

3. **Configurer le backend** :
   - Ajoutez un service "Empty Service"
   - Dans "Settings" → "Source" :
     - Root Directory : `backend`
     - Build Command : `npm install`
     - Start Command : `npm start`

4. **Variables d'environnement** (Settings → Variables) :
   ```
   PORT=3001
   JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.railway.app
   NODE_ENV=production
   ```

5. **Base de données** :
   - Railway crée automatiquement un volume pour la DB
   - Le fichier `vriends.db` sera persistant

6. **Déployer** :
   - Railway détecte automatiquement et déploie
   - Notez l'URL générée (ex: `https://vriends-backend.railway.app`)

### Frontend sur Railway

1. **Ajouter un nouveau service** dans le même projet Railway

2. **Configurer** :
   - Root Directory : `frontend` (ou racine si frontend est à la racine)
   - Build Command : `npm install && npm run build`
   - Start Command : `npx serve -s dist -l 3000`
   - Ou utilisez Vite preview : `npm run preview`

3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app/api
   ```

4. **Installer serve** (pour servir les fichiers statiques) :
   - Ajoutez dans `frontend/package.json` :
   ```json
   "dependencies": {
     "serve": "^14.2.1"
   }
   ```

---

## 🎨 OPTION 2 : RENDER

### Backend sur Render

1. **Créer un compte** sur [render.com](https://render.com)

2. **Nouveau Web Service** :
   - Connectez votre repo GitHub
   - Type : Web Service
   - Root Directory : `backend`
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Plan : Free (ou Paid)

3. **Variables d'environnement** :
   ```
   PORT=10000
   JWT_SECRET=votre_secret_jwt_tres_securise
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.onrender.com
   NODE_ENV=production
   ```

4. **Persistent Disk** (pour la DB) :
   - Dans "Advanced" → "Add Persistent Disk"
   - Mount Path : `/opt/render/project/src/db`

### Frontend sur Render

1. **Nouveau Static Site** :
   - Root Directory : `frontend`
   - Build Command : `npm install && npm run build`
   - Publish Directory : `dist`

2. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.onrender.com/api
   ```

---

## ⚡ OPTION 3 : VERCEL (Frontend) + RAILWAY (Backend)

### Frontend sur Vercel

1. **Créer un compte** sur [vercel.com](https://vercel.com)

2. **Importer le projet** :
   - Connectez votre repo GitHub
   - Framework Preset : Vite
   - Root Directory : `frontend`
   - Build Command : `npm run build`
   - Output Directory : `dist`

3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app/api
   ```

4. **Déployer** : Vercel déploie automatiquement

### Backend sur Railway
Suivez les instructions de l'Option 1 pour le backend.

---

## 🖥️ OPTION 4 : VPS (Ubuntu/Debian)

### Prérequis
- Serveur VPS avec Ubuntu 20.04+
- Accès SSH
- Node.js 18+ installé

### Installation sur VPS

```bash
# 1. Se connecter au serveur
ssh user@votre-serveur.com

# 2. Installer Node.js (si pas déjà installé)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2

# 4. Cloner le projet
git clone https://github.com/votre-repo/vriends-poperinge.git
cd vriends-poperinge
```

### Backend

```bash
cd backend
npm install --production

# Créer le fichier .env
nano .env
# Ajoutez :
# PORT=3001
# JWT_SECRET=votre_secret_jwt_tres_securise
# DB_PATH=./db/vriends.db
# FRONTEND_URL=https://votre-domaine.com
# NODE_ENV=production

# Démarrer avec PM2
pm2 start server.js --name vriends-backend
pm2 save
pm2 startup
```

### Frontend

```bash
cd frontend
npm install
npm run build

# Installer Nginx
sudo apt-get install nginx

# Configurer Nginx
sudo nano /etc/nginx/sites-available/vriends
```

Configuration Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /home/user/vriends-poperinge/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/vriends /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL avec Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## 📝 Fichiers à créer pour le déploiement

### backend/.gitignore
```
node_modules/
.env
db/*.db
db/*.db-shm
db/*.db-wal
```

### frontend/.gitignore
```
node_modules/
dist/
.env
.env.local
```

### backend/Procfile (pour Railway/Render)
```
web: node server.js
```

### frontend/package.json (ajouter serve)
```json
{
  "scripts": {
    "start": "serve -s dist -l 3000"
  },
  "dependencies": {
    "serve": "^14.2.1"
  }
}
```

---

## 🔒 Sécurité en Production

1. **JWT_SECRET** : Utilisez un secret fort et unique
2. **CORS** : Configurez `FRONTEND_URL` avec votre URL de production
3. **HTTPS** : Toujours utiliser HTTPS en production
4. **Variables d'environnement** : Ne jamais commiter le fichier `.env`
5. **Base de données** : Sauvegardez régulièrement `vriends.db`

---

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données initialisée (seed exécuté)
- [ ] CORS configuré avec l'URL de production
- [ ] HTTPS activé
- [ ] Tests de connexion frontend ↔ backend
- [ ] Tests de création de compte
- [ ] Tests de commande
- [ ] Backup de la base de données configuré

---

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifiez les logs : `pm2 logs` ou dans l'interface Railway/Render
- Vérifiez que le port est correct
- Vérifiez que JWT_SECRET est défini

### Frontend ne se connecte pas au backend
- Vérifiez `VITE_API_URL` dans les variables d'environnement
- Vérifiez CORS dans le backend
- Vérifiez que le backend est accessible publiquement

### Base de données vide
- Le seed s'exécute automatiquement au premier démarrage
- Vérifiez les logs du serveur pour voir si le seed a fonctionné

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs du serveur (Railway/Render/VPS)
2. La console du navigateur (F12)
3. Les variables d'environnement
4. La connexion réseau entre frontend et backend
