# 🔧 Fix Backend Dockerfile - package.json not found

## Problème
```
npm error path /app/package.json
```

Cela signifie que Railway ne trouve pas le `package.json` lors du build.

## ✅ Solutions

### Solution 1 : Vérifier Root Directory dans Railway

1. **Service backend** → **Settings** → **Source**
2. **Root Directory** : Doit être exactement `backend` (sans slash)
3. **Sauvegarder**

### Solution 2 : Vérifier Dockerfile Path

1. **Settings** → **Deploy**
2. **Builder** : `Dockerfile`
3. **Dockerfile Path** : `Dockerfile` (ou laisser vide si auto-détecté)
4. **Sauvegarder**

### Solution 3 : Vérifier le contexte de build

Le Dockerfile doit être dans `backend/Dockerfile` et Railway doit builder depuis `backend/`.

**Structure attendue** :
```
vriends-poperinge-frontend/
├── backend/
│   ├── Dockerfile          ← Ici
│   ├── package.json        ← Ici
│   ├── server.js
│   └── ...
```

**Configuration Railway** :
- Root Directory : `backend`
- Dockerfile Path : `Dockerfile` (relatif au Root Directory)

---

## 🔍 Vérification

### Dans les logs Railway, vous devriez voir :

✅ **Si ça marche** :
```
Step 1/7 : FROM node:18-alpine
Step 2/7 : WORKDIR /app
Step 3/7 : COPY package*.json ./
Step 4/7 : RUN npm install --production
...
🚀 Backend running on http://localhost:3001
```

❌ **Si ça ne marche pas** :
```
npm error path /app/package.json
```

---

## 📋 Checklist

- [ ] Root Directory = `backend` dans Settings → Source
- [ ] Dockerfile existe dans `backend/Dockerfile`
- [ ] `package.json` existe dans `backend/package.json`
- [ ] Builder = `Dockerfile` dans Settings → Deploy
- [ ] Dockerfile Path = `Dockerfile` (ou vide)
- [ ] Redéployé après changements

---

## 🆘 Si le problème persiste

### Option A : Recréer le service

1. **Supprimer** le service backend
2. **Créer un nouveau service** → GitHub Repo
3. **Dès la création** :
   - Root Directory : `backend`
   - Builder : `Dockerfile`
   - Start Command : **VIDE**
4. **Ajouter les variables d'environnement**
5. **Déployer**

### Option B : Utiliser Nixpacks au lieu de Dockerfile

1. **Settings** → **Deploy** → **Builder** : `Nixpacks`
2. **Root Directory** : `backend`
3. **Start Command** : `npm start`
4. **Redéployer**

---

## 💡 Explication

Le problème vient du fait que Railway essaie de builder depuis la racine, mais le Dockerfile cherche `package.json` dans `/app/`. Si le Root Directory n'est pas configuré correctement, Railway ne trouve pas le `package.json` dans le contexte de build.

**Solution** : S'assurer que Root Directory = `backend` dans Railway Settings.
