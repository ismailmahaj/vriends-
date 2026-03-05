# 🚂 Configuration Railway - Guide de Déploiement

## ⚠️ Problème : Railway essaie de builder depuis la racine

Railway exécute `npm ci` à la racine alors que le `package.json` du backend est dans `backend/`.

## ✅ Solution : Configurer le Root Directory dans Railway

### Étape 1 : Dans l'interface Railway

1. **Ouvrir votre projet** sur [railway.app](https://railway.app)
2. **Sélectionner le service backend**
3. Aller dans **Settings** (⚙️)
4. Dans la section **Source** :
   - **Root Directory** : `backend`
   - **Build Command** : `npm ci` (ou laisser vide, Railway le détectera)
   - **Start Command** : `npm start`
5. **Sauvegarder**

### Étape 2 : Variables d'environnement

Dans **Settings** → **Variables**, ajouter :

```
PORT=3001
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
DB_PATH=./db/vriends.db
FRONTEND_URL=https://votre-frontend.railway.app
NODE_ENV=production
```

### Étape 3 : Redéployer

1. Aller dans **Deployments**
2. Cliquer sur **Redeploy** ou faire un nouveau commit

---

## 🔧 Alternative : Utiliser nixpacks.toml

Si Railway ne détecte pas automatiquement, un fichier `nixpacks.toml` a été créé à la racine pour forcer le build depuis `backend/`.

---

## 📋 Checklist de Configuration Railway

### Backend Service
- [ ] Root Directory : `backend`
- [ ] Build Command : `npm ci` (ou vide)
- [ ] Start Command : `npm start`
- [ ] Variables d'environnement configurées
- [ ] Port exposé (Railway le fait automatiquement)

### Frontend Service
- [ ] Root Directory : `/` (racine)
- [ ] Build Command : `npm install && npm run build`
- [ ] Start Command : `npm start`
- [ ] Variable `VITE_API_URL` configurée avec l'URL du backend

---

## 🐛 Dépannage

### Erreur : "npm ci failed"

**Cause** : Railway essaie de builder depuis la racine.

**Solution** :
1. Vérifier que **Root Directory** est bien `backend`
2. Vérifier que `backend/package-lock.json` existe
3. Si problème persiste, supprimer le service et le recréer avec le bon Root Directory

### Erreur : "Cannot find module"

**Cause** : Les dépendances ne sont pas installées.

**Solution** :
1. Vérifier que `npm ci` s'exécute bien dans `backend/`
2. Vérifier les logs de build dans Railway
3. Essayer `npm install` au lieu de `npm ci` dans Build Command

### Erreur : "Port already in use"

**Cause** : Conflit de port.

**Solution** :
- Railway assigne automatiquement un port via la variable `PORT`
- Ne pas hardcoder le port dans le code
- Utiliser `process.env.PORT || 3001` dans `server.js`

---

## 📝 Structure du Projet

```
vriends-poperinge-frontend/
├── backend/              ← Root Directory pour le service backend
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── ...
├── src/                  ← Frontend
├── package.json          ← Frontend package.json
└── nixpacks.toml        ← Configuration Railway (si nécessaire)
```

---

## 🚀 Commandes Utiles

```bash
# Vérifier la structure locale
ls -la backend/

# Vérifier que package-lock.json existe
ls backend/package-lock.json

# Tester le build localement
cd backend
npm ci
npm start
```
