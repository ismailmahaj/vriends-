# 🎨 Déploiement Frontend sur Railway

## ✅ Fichiers créés

- `Dockerfile` : Build et serve le frontend
- `.dockerignore` : Ignore les fichiers inutiles
- `railway.json` : Configuration Railway

## 🚀 Étapes de Déploiement

### Étape 1 : Créer le service Frontend sur Railway

1. **Aller sur railway.app** → Votre projet
2. **"+ New"** → **"GitHub Repo"** (ou "Empty Service")
3. **Sélectionner votre repository**

### Étape 2 : Configurer le service

Dans **Settings** (⚙️) :

#### Section "Deploy" :
- **Builder** : `Dockerfile`
- **Dockerfile Path** : `Dockerfile` (ou laisser vide si auto-détecté)
- **Start Command** : **LAISSER VIDE** ⚠️ (le Dockerfile gère tout)

#### Section "Source" :
- **Root Directory** : `/` (racine, ou laisser vide)

### Étape 3 : Variables d'environnement

**Settings** → **Variables** :

```
VITE_API_URL=https://votre-backend.railway.app/api
```

⚠️ **IMPORTANT** : Remplacez `votre-backend.railway.app` par l'URL réelle de votre backend Railway.

Pour trouver l'URL du backend :
1. Aller dans votre service backend sur Railway
2. Cliquer sur l'onglet **"Settings"**
3. Section **"Networking"** → **"Generate Domain"** (si pas déjà fait)
4. Copier l'URL (ex: `https://vriends-backend-production.up.railway.app`)

### Étape 4 : Déployer

1. **Sauvegarder** les configurations
2. Railway va automatiquement :
   - Builder le frontend avec `npm run build`
   - Créer une image Docker
   - Démarrer le serveur avec `serve`

### Étape 5 : Obtenir l'URL du frontend

1. Dans votre service frontend → **Settings**
2. Section **"Networking"** → **"Generate Domain"**
3. Copier l'URL (ex: `https://vriends-frontend-production.up.railway.app`)

### Étape 6 : Mettre à jour le backend

1. **Retourner dans le service backend** → **Settings** → **Variables**
2. **Mettre à jour** `FRONTEND_URL` avec l'URL réelle du frontend :
   ```
   FRONTEND_URL=https://votre-frontend.railway.app
   ```
3. **Redéployer** le backend (Railway redéploie automatiquement)

---

## 🔍 Vérification

### Dans les logs Railway (frontend), vous devriez voir :

✅ **Si ça marche** :
```
> vite build
vite v8.x.x building for production...
✓ built in Xs

> serve -s dist -l 3000
┌─────────────────────────────────────────┐
│                                         │
│   Serving!                              │
│                                         │
│   - Local:    http://localhost:3000   │
│   - Network:  http://0.0.0.0:3000      │
│                                         │
└─────────────────────────────────────────┘
```

### Tester dans le navigateur

1. Ouvrir l'URL du frontend
2. Vérifier que la page se charge
3. Tester la connexion au backend (créer un compte, se connecter)

---

## 🐛 Dépannage

### Erreur : "Cannot find module"

**Cause** : Dépendances manquantes

**Solution** :
- Vérifier que `package-lock.json` est à jour
- Vérifier les logs de build dans Railway

### Erreur : "VITE_API_URL is not defined"

**Cause** : Variable d'environnement non définie

**Solution** :
- Vérifier que `VITE_API_URL` est bien configurée dans Railway
- ⚠️ Les variables Vite doivent commencer par `VITE_`
- Redéployer après avoir ajouté la variable

### Le frontend ne se connecte pas au backend

**Cause** : CORS ou URL incorrecte

**Solution** :
1. Vérifier que `VITE_API_URL` pointe vers le bon backend
2. Vérifier que `FRONTEND_URL` dans le backend pointe vers le frontend
3. Vérifier les logs du backend pour les erreurs CORS

---

## 📋 Checklist

- [ ] Service frontend créé sur Railway
- [ ] Builder = `Dockerfile`
- [ ] Start Command = **VIDE**
- [ ] Variable `VITE_API_URL` configurée avec l'URL du backend
- [ ] Frontend déployé et accessible
- [ ] `FRONTEND_URL` mis à jour dans le backend
- [ ] Backend redéployé
- [ ] Test de connexion frontend ↔ backend réussi

---

## 🎯 Structure du Dockerfile

Le Dockerfile utilise un **multi-stage build** :

1. **Stage 1 (builder)** : Installe les dépendances et build l'app
2. **Stage 2 (production)** : Installe `serve` et sert les fichiers statiques

Cela permet d'avoir une image finale plus légère (sans les dépendances de dev).

---

## 💡 Alternative : Utiliser Nixpacks (sans Dockerfile)

Si vous préférez ne pas utiliser Dockerfile :

1. **Settings** → **Deploy** → **Builder** : `Nixpacks`
2. **Root Directory** : `/` (racine)
3. **Build Command** : `npm install && npm run build`
4. **Start Command** : `npx serve -s dist -l 3000`

Mais le Dockerfile est recommandé car plus fiable et plus rapide.
