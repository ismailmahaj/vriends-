# 🚀 Guide Rapide de Déploiement

## Option la plus simple : Railway (Recommandé)

### Étape 1 : Préparer le projet

1. **Créer un compte GitHub** (si pas déjà fait)
2. **Pousser votre code sur GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/vriends-poperinge.git
   git push -u origin main
   ```

### Étape 2 : Déployer le Backend

1. **Aller sur [railway.app](https://railway.app)** et créer un compte
2. **Nouveau Projet** → "Deploy from GitHub repo"
3. **Sélectionner votre repository**
4. **Ajouter un service** → "Empty Service"
5. **Configurer** :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
6. **Variables d'environnement** (Settings → Variables) :
   ```
   PORT=3001
   JWT_SECRET=votre_secret_jwt_tres_securise_123456789
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.railway.app
   NODE_ENV=production
   ```
7. **Noter l'URL du backend** (ex: `https://vriends-backend.railway.app`)

### Étape 3 : Déployer le Frontend

1. **Dans le même projet Railway**, ajouter un **nouveau service**
2. **Configurer** :
   - **Root Directory** : `/` (racine)
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app/api
   ```
   ⚠️ **Important** : Remplacez `votre-backend.railway.app` par l'URL réelle de votre backend
4. **Noter l'URL du frontend** (ex: `https://vriends-frontend.railway.app`)

### Étape 4 : Mettre à jour les URLs

1. **Retourner dans le backend** → Variables d'environnement
2. **Mettre à jour** `FRONTEND_URL` avec l'URL réelle du frontend
3. **Redéployer** le backend (Railway redéploie automatiquement)

### Étape 5 : Tester

1. Ouvrir l'URL du frontend dans le navigateur
2. Créer un compte
3. Se connecter avec `admin@vriends.be` / `admin1234`
4. Tester une commande

---

## Alternative : Render

### Backend sur Render

1. **Aller sur [render.com](https://render.com)**
2. **New** → **Web Service**
3. **Connecter GitHub** et sélectionner votre repo
4. **Configurer** :
   - **Name** : `vriends-backend`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free
5. **Variables d'environnement** :
   ```
   PORT=10000
   JWT_SECRET=votre_secret_jwt_tres_securise
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.onrender.com
   NODE_ENV=production
   ```
6. **Advanced** → **Add Persistent Disk** :
   - **Mount Path** : `/opt/render/project/src/db`
   - **Name** : `vriends-db`

### Frontend sur Render

1. **New** → **Static Site**
2. **Configurer** :
   - **Name** : `vriends-frontend`
   - **Root Directory** : `/` (racine)
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.onrender.com/api
   ```

---

## 🔧 Configuration importante

### Fichier `.env` en production

**Backend** (`backend/.env`) :
```env
PORT=3001
JWT_SECRET=changez_moi_avec_un_secret_long_et_aleatoire
DB_PATH=./db/vriends.db
FRONTEND_URL=https://votre-frontend.railway.app
NODE_ENV=production
```

**Frontend** (variables d'environnement dans Railway/Render) :
```env
VITE_API_URL=https://votre-backend.railway.app/api
```

### Générer un JWT_SECRET sécurisé

```bash
# Sur Mac/Linux
openssl rand -base64 32

# Ou utiliser un générateur en ligne
# https://randomkeygen.com/
```

---

## ✅ Checklist avant déploiement

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées
- [ ] `JWT_SECRET` changé (ne pas utiliser la valeur par défaut)
- [ ] `FRONTEND_URL` pointe vers l'URL de production du frontend
- [ ] `VITE_API_URL` pointe vers l'URL de production du backend
- [ ] Base de données sera persistante (Railway le fait automatiquement, Render nécessite un Persistent Disk)

---

## 🐛 Problèmes courants

### Le frontend ne se connecte pas au backend

1. Vérifier que `VITE_API_URL` est correct
2. Vérifier que le backend est accessible (ouvrir l'URL dans le navigateur)
3. Vérifier CORS dans le backend (variable `FRONTEND_URL`)

### Erreur 401 Unauthorized

- Vérifier que `JWT_SECRET` est le même partout
- Vérifier que le token est bien stocké dans localStorage

### Base de données vide

- Le seed s'exécute automatiquement au premier démarrage
- Vérifier les logs du serveur pour voir si le seed a fonctionné
- Si besoin, se connecter en admin et vérifier les produits

---

## 📱 Domaine personnalisé (optionnel)

### Railway

1. Dans les **Settings** du service
2. **Domains** → **Custom Domain**
3. Ajouter votre domaine
4. Suivre les instructions DNS

### Render

1. Dans les **Settings** du service
2. **Custom Domains**
3. Ajouter votre domaine
4. Configurer les DNS selon les instructions

---

## 💰 Coûts

- **Railway** : Gratuit jusqu'à 500 heures/mois, puis $5/mois
- **Render** : Gratuit avec limitations (sleep après inactivité), puis $7/mois
- **Vercel** : Gratuit pour les sites statiques

---

## 🎯 Recommandation

**Pour débuter** : Railway est le plus simple et le plus rapide à configurer.

**Pour la production** : Railway ou Render avec un plan payant pour éviter le "sleep" des services gratuits.
