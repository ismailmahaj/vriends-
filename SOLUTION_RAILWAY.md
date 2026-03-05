# 🚂 SOLUTION DÉFINITIVE - Railway

## ⚠️ Le problème
Railway essaie de builder depuis la racine au lieu de `backend/`.

## ✅ SOLUTION SIMPLE (À FAIRE MAINTENANT)

### Option A : Recréer le service avec le bon Root Directory

1. **Sur Railway** :
   - Allez dans votre projet
   - Cliquez sur le service backend
   - **Settings** (⚙️) → **Delete Service** (en bas)
   - Confirmez la suppression

2. **Créer un nouveau service** :
   - Cliquez sur **"+ New"** → **"GitHub Repo"**
   - Sélectionnez votre repository
   - **IMPORTANT** : Avant de créer, cliquez sur **"⚙️ Settings"** ou **"Configure"**
   - **Root Directory** : Tapez `backend` (exactement, sans slash)
   - **Start Command** : `npm start`
   - Créez le service

3. **Variables d'environnement** :
   ```
   PORT=3001
   JWT_SECRET=votre_secret_jwt_tres_securise_123456789
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.railway.app
   NODE_ENV=production
   ```

4. **Déployer** : Railway devrait maintenant builder depuis `backend/`

---

### Option B : Utiliser Dockerfile (Plus fiable)

Un `Dockerfile` a été créé dans `backend/Dockerfile`. Railway détectera automatiquement Docker.

**Étapes** :

1. **Sur Railway** → Service backend → **Settings**

2. **Section "Deploy"** :
   - **Builder** : Sélectionner **"Dockerfile"**
   - Railway devrait détecter `backend/Dockerfile` automatiquement

3. **Si Railway ne détecte pas automatiquement** :
   - **Dockerfile Path** : `backend/Dockerfile`

4. **Variables d'environnement** (même chose que Option A)

5. **Redéployer**

---

## 🔍 Vérification

### Dans les logs Railway, vous devriez voir :

✅ **Si ça marche** :
```
Step 1/6 : FROM node:18-alpine
Step 2/6 : WORKDIR /app
Step 3/6 : COPY package*.json ./
Step 4/6 : RUN npm ci --only=production
...
🚀 Backend running on http://localhost:3001
```

❌ **Si ça ne marche pas** :
```
npm error A complete log...
ERROR: failed to build
```

---

## 📋 Checklist

- [ ] Service backend supprimé et recréé OU Dockerfile activé
- [ ] Root Directory = `backend` (si pas Dockerfile)
- [ ] Variables d'environnement configurées
- [ ] Redéployé
- [ ] Logs montrent un build réussi

---

## 🆘 Si RIEN ne fonctionne

### Solution de dernier recours : Déplacer le backend à la racine

Si Railway refuse absolument de builder depuis `backend/`, on peut restructurer :

```bash
# Créer une branche pour tester
git checkout -b railway-fix

# Déplacer backend à la racine (temporairement)
# Mais cela nécessiterait de restructurer tout le projet...
```

**Mais avant ça**, essayez l'**Option B (Dockerfile)** - c'est la plus fiable.

---

## 💡 Pourquoi ça ne marche pas ?

Railway détecte automatiquement le `package.json` à la racine du repository. Si vous n'avez pas configuré le **Root Directory**, il essaie de builder depuis la racine.

**Solutions** :
1. ✅ Configurer Root Directory = `backend` (dans Settings)
2. ✅ Utiliser Dockerfile (détection automatique)
3. ✅ Utiliser `nixpacks.toml` dans `backend/` (créé)

---

## 🎯 Recommandation

**Essayez dans cet ordre** :
1. **Option A** : Recréer le service avec Root Directory = `backend`
2. **Option B** : Utiliser le Dockerfile (plus fiable)
3. Si toujours pas : Contactez le support Railway

Le Dockerfile est généralement la solution la plus fiable car Railway détecte automatiquement Docker.
