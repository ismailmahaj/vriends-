# 🔧 Troubleshooting - Application failed to respond

## Problème
L'application est déployée mais ne répond pas quand vous accédez à l'URL.

## ✅ Checklist de Diagnostic

### 1. Vérifier les Logs Railway

**Pour le Backend** :
1. Aller dans le service `vriends-backend`
2. Cliquer sur **"Deployments"**
3. Cliquer sur le dernier déploiement
4. Voir les **logs** (onglet "Logs" ou "View Logs")

**Chercher** :
- ✅ `🚀 Backend running on http://localhost:3001` → L'app démarre
- ❌ Erreurs de connexion à la base de données
- ❌ Erreurs de variables d'environnement manquantes
- ❌ Erreurs de port

**Pour le Frontend** :
1. Aller dans le service `vriends-frontend`
2. Même processus
3. Chercher : `Serving! - Local: http://localhost:3000`

---

### 2. Vérifier les Variables d'Environnement

**Backend** (Settings → Variables) :
```
PORT=3001
JWT_SECRET=votre_secret_jwt_tres_securise
DB_PATH=./db/vriends.db
FRONTEND_URL=https://votre-frontend.railway.app
NODE_ENV=production
```

⚠️ **Important** :
- `FRONTEND_URL` doit être l'URL **réelle** du frontend Railway
- `JWT_SECRET` doit être défini (pas vide)

**Frontend** (Settings → Variables) :
```
VITE_API_URL=https://votre-backend.railway.app/api
```

⚠️ **Important** :
- `VITE_API_URL` doit être l'URL **réelle** du backend Railway
- Doit se terminer par `/api`

---

### 3. Vérifier le Port

Railway assigne automatiquement un port via la variable `PORT`.

**Vérifier dans `server.js`** :
```javascript
const PORT = process.env.PORT || 3001;
```

✅ Correct : Utilise `process.env.PORT` (Railway le définit automatiquement)

❌ Incorrect : Port hardcodé comme `app.listen(3001)`

---

### 4. Vérifier la Base de Données

**Problèmes courants** :
- Le dossier `db/` n'existe pas
- Permissions d'écriture manquantes
- Le seed ne s'exécute pas

**Solution** : Le Dockerfile crée déjà le dossier `db/` avec `RUN mkdir -p /app/db`

---

### 5. Vérifier les URLs

**Backend URL** :
- Format : `https://vriends-backend-production.up.railway.app`
- Tester : `https://votre-backend.railway.app/api/health`
- Devrait retourner : `{"status":"ok"}`

**Frontend URL** :
- Format : `https://vriends-frontend-production.up.railway.app`
- Devrait afficher la page d'accueil

---

## 🐛 Erreurs Courantes et Solutions

### Erreur : "Cannot find module"

**Cause** : Dépendances non installées

**Solution** :
- Vérifier que `npm install` s'exécute dans les logs
- Vérifier que `package.json` est correct

### Erreur : "Port already in use"

**Cause** : Port hardcodé

**Solution** :
- Utiliser `process.env.PORT || 3001` dans `server.js`

### Erreur : "Database file not found"

**Cause** : Dossier `db/` n'existe pas

**Solution** :
- Le Dockerfile crée déjà le dossier
- Vérifier les logs pour voir si le seed s'exécute

### Erreur : "JWT_SECRET is not defined"

**Cause** : Variable d'environnement manquante

**Solution** :
- Ajouter `JWT_SECRET` dans Railway Settings → Variables

### Erreur : CORS

**Cause** : `FRONTEND_URL` incorrect ou non défini

**Solution** :
- Vérifier que `FRONTEND_URL` pointe vers l'URL réelle du frontend
- Redéployer le backend après modification

---

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Tester le Backend

1. **Obtenir l'URL du backend** (Settings → Networking)
2. **Tester** : `https://votre-backend.railway.app/api/health`
3. **Résultat attendu** : `{"status":"ok"}`

**Si ça ne marche pas** :
- Vérifier les logs Railway
- Vérifier que le service est "Online" (pas "Crashed")
- Vérifier les variables d'environnement

### Étape 2 : Tester le Frontend

1. **Obtenir l'URL du frontend**
2. **Ouvrir dans le navigateur**
3. **Résultat attendu** : Page d'accueil s'affiche

**Si ça ne marche pas** :
- Vérifier les logs Railway
- Vérifier que `VITE_API_URL` est correct
- Ouvrir la console du navigateur (F12) pour voir les erreurs

### Étape 3 : Tester la Connexion Frontend ↔ Backend

1. **Ouvrir le frontend**
2. **Essayer de créer un compte**
3. **Vérifier la console du navigateur** (F12)

**Erreurs possibles** :
- `CORS error` → Vérifier `FRONTEND_URL` dans le backend
- `Network error` → Vérifier `VITE_API_URL` dans le frontend
- `401 Unauthorized` → Vérifier `JWT_SECRET`

---

## 📋 Checklist Complète

- [ ] Backend déployé et "Online" (pas "Crashed")
- [ ] Frontend déployé et "Online"
- [ ] Variables d'environnement configurées
- [ ] `FRONTEND_URL` = URL réelle du frontend
- [ ] `VITE_API_URL` = URL réelle du backend + `/api`
- [ ] `JWT_SECRET` défini
- [ ] Backend répond sur `/api/health`
- [ ] Frontend s'affiche
- [ ] Pas d'erreurs dans les logs Railway
- [ ] Pas d'erreurs dans la console du navigateur

---

## 🆘 Solution de Dernier Recours

Si rien ne fonctionne :

1. **Vérifier les logs Railway** (le plus important !)
2. **Copier les erreurs** des logs
3. **Vérifier chaque variable d'environnement** une par une
4. **Redéployer** après chaque modification
5. **Tester** après chaque redéploiement

Les logs Railway contiennent toutes les informations nécessaires pour diagnostiquer le problème.
