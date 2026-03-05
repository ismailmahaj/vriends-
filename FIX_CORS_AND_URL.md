# 🔧 Fix CORS et URL - Erreur Inscription

## Problème Identifié

1. **Frontend** essaie de se connecter à `http://localhost:3001` au lieu de l'URL Railway
2. **Backend** a `FRONTEND_URL` = `http://localhost:5173` au lieu de l'URL de production

## ✅ Solution

### Étape 1 : Configurer VITE_API_URL dans Railway

1. **Service frontend** → **Settings** → **Variables**
2. **Ajouter/Modifier** :
   ```
   VITE_API_URL=https://vriends-backend-production.up.railway.app/api
   ```
   ⚠️ **Important** :
   - Avec `https://`
   - Avec `/api` à la fin
   - **Sans** `/` après `/api`

3. **Sauvegarder**

### Étape 2 : Redéployer le Frontend

⚠️ **CRUCIAL** : Les variables Vite (`VITE_*`) sont injectées **au moment du build**. Si vous modifiez `VITE_API_URL`, vous devez **redéployer** le frontend pour que Railway rebuild avec la nouvelle variable.

1. **Deployments** → **Redeploy** (ou faire un commit + push)
2. **Attendre** que le build se termine

### Étape 3 : Configurer FRONTEND_URL dans le Backend

1. **Service backend** → **Settings** → **Variables**
2. **Modifier** `FRONTEND_URL` :
   ```
   FRONTEND_URL=https://vriends-frontend-production.up.railway.app
   ```
   ⚠️ **Important** :
   - Avec `https://`
   - **Sans** `/` à la fin
   - **Sans** `/api` ou autre chemin

3. **Sauvegarder**

### Étape 4 : Redéployer le Backend

1. **Deployments** → **Redeploy**
2. **Attendre** que le déploiement se termine

---

## 🔍 Vérification

### Vérifier que VITE_API_URL est correcte

Après redéploiement du frontend, ouvrir la console du navigateur et vérifier :
- Les requêtes doivent aller vers : `https://vriends-backend-production.up.railway.app/api/...`
- **Pas** vers `http://localhost:3001`

### Vérifier que CORS fonctionne

1. **Ouvrir le frontend** : `https://vriends-frontend-production.up.railway.app`
2. **Ouvrir la console** (F12)
3. **Essayer de s'inscrire**
4. **Vérifier** qu'il n'y a **plus** d'erreur CORS

---

## 📋 Checklist

- [ ] `VITE_API_URL` = `https://vriends-backend-production.up.railway.app/api` dans Railway
- [ ] Frontend **redéployé** après modification de `VITE_API_URL`
- [ ] `FRONTEND_URL` = `https://vriends-frontend-production.up.railway.app` dans Railway
- [ ] Backend **redéployé** après modification de `FRONTEND_URL`
- [ ] Console du navigateur vérifiée (plus d'erreur CORS)
- [ ] Les requêtes vont vers l'URL Railway (pas localhost)

---

## ⚠️ Note Importante

**Les variables Vite sont injectées au BUILD** :
- Si vous modifiez `VITE_API_URL`, Railway doit **rebuild** le frontend
- C'est pour ça qu'il faut **redéployer** après modification
- Le build peut prendre 2-3 minutes

**Les variables Node.js sont injectées au RUNTIME** :
- Si vous modifiez `FRONTEND_URL`, Railway redémarre juste le serveur
- Plus rapide (quelques secondes)

---

## 🐛 Si ça ne marche toujours pas

1. **Vérifier les logs Railway** :
   - Frontend : Vérifier que le build s'est bien passé
   - Backend : Vérifier que le serveur démarre

2. **Vérifier dans la console du navigateur** :
   - Les requêtes doivent aller vers l'URL Railway
   - Plus d'erreur CORS

3. **Tester le backend directement** :
   ```
   https://vriends-backend-production.up.railway.app/api/health
   ```
   Devrait retourner : `{"status":"ok"}`

---

## 💡 Explication

Le problème vient du fait que :
1. Le frontend a été buildé avec `VITE_API_URL` = `http://localhost:3001/api` (valeur par défaut)
2. Le backend a `FRONTEND_URL` = `http://localhost:5173` (valeur par défaut)

En production, il faut utiliser les URLs Railway, pas localhost.

Après avoir configuré les bonnes variables et redéployé, ça devrait fonctionner ! 🎯
