# 🔧 Fix Erreur Inscription

## Diagnostic

Pour identifier le problème exact, suivez ces étapes :

### 1. Vérifier la Console du Navigateur (PRIORITAIRE)

1. **Ouvrir le frontend** : `https://vriends-frontend-production.up.railway.app`
2. **Ouvrir la console** (F12 ou Cmd+Option+I)
3. **Aller sur la page d'inscription**
4. **Remplir le formulaire** et cliquer sur "S'inscrire"
5. **Regarder les erreurs** dans la console

**Erreurs possibles** :
- ❌ `CORS error` → Problème de CORS (voir Solution 1)
- ❌ `Network Error` ou `Failed to fetch` → Backend inaccessible (voir Solution 2)
- ❌ `401 Unauthorized` → Problème d'authentification
- ❌ `400 Bad Request` → Données invalides
- ❌ `500 Internal Server Error` → Erreur serveur (voir Solution 3)

**Copier l'erreur exacte** et la partager.

---

### 2. Vérifier les Logs Railway Backend

1. **Service backend** → **Deployments** → **Dernier déploiement** → **Logs**
2. **Essayer de s'inscrire** depuis le frontend
3. **Regarder les logs** pour voir les erreurs

**Chercher** :
- ✅ `✅ Utilisateur créé:` → Inscription réussie
- ❌ `❌ Erreur inscription:` → Erreur serveur
- ❌ Erreurs de base de données
- ❌ Erreurs de validation

---

## ✅ Solutions

### Solution 1 : Erreur CORS

**Symptôme** : `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause** : `FRONTEND_URL` incorrect dans le backend

**Solution** :
1. **Backend** → Settings → Variables
2. **Vérifier** `FRONTEND_URL` = `https://vriends-frontend-production.up.railway.app`
3. **Sans** le `/` à la fin
4. **Avec** `https://`
5. **Redéployer** le backend

---

### Solution 2 : Network Error / Failed to fetch

**Symptôme** : `Network Error` ou `Failed to fetch`

**Cause** : `VITE_API_URL` incorrect ou backend inaccessible

**Solution** :
1. **Vérifier** que le backend est "Online" (pas "Crashed")
2. **Tester** le backend directement : `https://vriends-backend-production.up.railway.app/api/health`
   - Devrait retourner : `{"status":"ok"}`
3. **Frontend** → Settings → Variables
4. **Vérifier** `VITE_API_URL` = `https://vriends-backend-production.up.railway.app/api`
5. **Avec** `https://`
6. **Avec** `/api` à la fin
7. **Redéployer** le frontend

---

### Solution 3 : Erreur 500 (Internal Server Error)

**Symptôme** : `500 Internal Server Error` dans la console

**Cause** : Erreur serveur (base de données, variables d'environnement, etc.)

**Solution** :
1. **Voir les logs Railway backend** (voir étape 2 ci-dessus)
2. **Vérifier les variables d'environnement** :
   ```
   PORT=3001
   JWT_SECRET=votre_secret_jwt_tres_securise
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://vriends-frontend-production.up.railway.app
   NODE_ENV=production
   ```
3. **Vérifier** que la base de données est accessible
4. **Vérifier** que le seed s'est exécuté (voir logs)

---

### Solution 4 : Erreur 400 (Bad Request)

**Symptôme** : `400 Bad Request` avec message d'erreur

**Causes possibles** :
- Email déjà utilisé
- Mot de passe trop court (< 8 caractères)
- Champs manquants

**Solution** :
- Lire le message d'erreur dans la console
- Vérifier que tous les champs sont remplis
- Vérifier que le mot de passe fait au moins 8 caractères
- Essayer avec un autre email

---

## 🔍 Vérifications

### Vérifier que le Backend répond

Ouvrir dans le navigateur :
```
https://vriends-backend-production.up.railway.app/api/health
```

**Résultat attendu** : `{"status":"ok"}`

Si ça ne marche pas :
- Le backend ne démarre pas
- Vérifier les logs Railway
- Vérifier que le service est "Online"

### Vérifier la Configuration

**Backend Variables** :
```
FRONTEND_URL=https://vriends-frontend-production.up.railway.app
```

**Frontend Variables** :
```
VITE_API_URL=https://vriends-backend-production.up.railway.app/api
```

---

## 📋 Checklist

- [ ] Console du navigateur consultée (F12)
- [ ] Erreur exacte identifiée
- [ ] Logs Railway backend consultés
- [ ] Backend répond sur `/api/health`
- [ ] Variables d'environnement correctes
- [ ] Backend "Online" (pas "Crashed")
- [ ] Frontend "Online"

---

## 🆘 Si Rien ne Fonctionne

1. **Copier l'erreur exacte** de la console du navigateur
2. **Copier les dernières lignes** des logs Railway backend
3. **Partager ces informations** pour diagnostic approfondi

Les erreurs dans la console du navigateur et les logs Railway contiennent toutes les informations nécessaires pour identifier le problème.
