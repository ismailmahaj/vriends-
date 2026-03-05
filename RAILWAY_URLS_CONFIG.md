# 🔗 Configuration des URLs Railway

## Vos URLs

- **Frontend** : `https://vriends-frontend-production.up.railway.app`
- **Backend** : `https://vriends-backend-production.up.railway.app`

## ✅ Configuration Requise

### Backend - Variables d'environnement

Dans le service `vriends-backend` → **Settings** → **Variables** :

```
PORT=3001
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
DB_PATH=./db/vriends.db
FRONTEND_URL=https://vriends-frontend-production.up.railway.app
NODE_ENV=production
```

⚠️ **Important** : 
- `FRONTEND_URL` doit être **exactement** : `https://vriends-frontend-production.up.railway.app`
- **Sans** le `/` à la fin
- **Avec** `https://`

### Frontend - Variables d'environnement

Dans le service `vriends-frontend` → **Settings** → **Variables** :

```
VITE_API_URL=https://vriends-backend-production.up.railway.app/api
```

⚠️ **Important** :
- `VITE_API_URL` doit être **exactement** : `https://vriends-backend-production.up.railway.app/api`
- **Avec** `https://`
- **Avec** `/api` à la fin

---

## 🔍 Vérification

### 1. Tester le Backend

Ouvrir dans le navigateur :
```
https://vriends-backend-production.up.railway.app/api/health
```

**Résultat attendu** : `{"status":"ok"}`

Si ça ne marche pas :
- Vérifier que le backend est "Online" (pas "Crashed")
- Vérifier les logs Railway

### 2. Tester le Frontend

Ouvrir dans le navigateur :
```
https://vriends-frontend-production.up.railway.app
```

**Résultat attendu** : Page d'accueil s'affiche

### 3. Tester la Connexion

1. Ouvrir le frontend
2. Ouvrir la console du navigateur (F12)
3. Essayer de créer un compte
4. Vérifier qu'il n'y a pas d'erreurs CORS ou réseau

---

## 📋 Checklist

- [ ] Backend : `FRONTEND_URL` = `https://vriends-frontend-production.up.railway.app`
- [ ] Frontend : `VITE_API_URL` = `https://vriends-backend-production.up.railway.app/api`
- [ ] Backend redéployé après modification de `FRONTEND_URL`
- [ ] Frontend redéployé après modification de `VITE_API_URL`
- [ ] `/api/health` répond avec `{"status":"ok"}`
- [ ] Frontend s'affiche correctement
- [ ] Pas d'erreurs CORS dans la console

---

## 🐛 Problèmes Courants

### Erreur CORS

**Cause** : `FRONTEND_URL` incorrect dans le backend

**Solution** :
1. Vérifier que `FRONTEND_URL` = `https://vriends-frontend-production.up.railway.app`
2. **Redéployer** le backend
3. Tester à nouveau

### Erreur "Network Error" ou "Failed to fetch"

**Cause** : `VITE_API_URL` incorrect dans le frontend

**Solution** :
1. Vérifier que `VITE_API_URL` = `https://vriends-backend-production.up.railway.app/api`
2. **Redéployer** le frontend
3. Tester à nouveau

### Le frontend s'affiche mais ne peut pas se connecter au backend

**Cause** : Variables d'environnement non redéployées

**Solution** :
- Les variables Vite (`VITE_*`) doivent être définies **avant** le build
- Si vous modifiez `VITE_API_URL`, vous devez **redéployer** le frontend
- Railway rebuild le frontend avec les nouvelles variables

---

## 🚀 Étapes pour Corriger

1. **Backend** → Settings → Variables
   - Vérifier/modifier `FRONTEND_URL` = `https://vriends-frontend-production.up.railway.app`
   - **Sauvegarder**
   - **Redéployer** (Deployments → Redeploy)

2. **Frontend** → Settings → Variables
   - Vérifier/modifier `VITE_API_URL` = `https://vriends-backend-production.up.railway.app/api`
   - **Sauvegarder**
   - **Redéployer** (Deployments → Redeploy)

3. **Tester** :
   - Backend : `https://vriends-backend-production.up.railway.app/api/health`
   - Frontend : `https://vriends-frontend-production.up.railway.app`

---

## 💡 Note Importante

Les variables d'environnement Vite (`VITE_*`) sont **injectées au moment du build**. Si vous modifiez `VITE_API_URL`, Railway doit **rebuild** le frontend pour que les changements prennent effet.

C'est pour ça qu'il faut **redéployer** après avoir modifié `VITE_API_URL`.
