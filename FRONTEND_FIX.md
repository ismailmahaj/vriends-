# 🔧 Fix Frontend - Railway

## Problème
Railway essaie de faire `npm ci` mais le `package-lock.json` n'est pas synchronisé avec `package.json` (on a ajouté `serve`).

## ✅ Solutions

### Solution 1 : Forcer Dockerfile (Recommandé)

1. **Sur Railway** → Service frontend → **Settings** → **Deploy**
2. **Builder** : Sélectionner **"Dockerfile"** (pas Nixpacks)
3. **Dockerfile Path** : `Dockerfile` (ou laisser vide si auto-détecté)
4. **Start Command** : **LAISSER VIDE** ⚠️
5. **Sauvegarder** et **Redéployer**

Le Dockerfile utilise déjà `npm install` au lieu de `npm ci`, donc ça devrait fonctionner.

---

### Solution 2 : Utiliser Nixpacks avec npm install

Si Railway utilise Nixpacks, un fichier `nixpacks.toml` a été créé qui force `npm install` au lieu de `npm ci`.

1. **Settings** → **Deploy** → **Builder** : `Nixpacks`
2. Railway devrait détecter automatiquement `nixpacks.toml`
3. **Redéployer**

---

### Solution 3 : Mettre à jour package-lock.json localement

Si vous voulez utiliser `npm ci` (plus rapide), mettez à jour le lock file :

```bash
# Dans votre terminal local
cd /Users/ismailmahaj/vriends/vriends-poperinge-frontend
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

Puis redéployez sur Railway.

---

## 🔍 Vérification

### Dans les logs Railway, vous devriez voir :

✅ **Si ça marche avec Dockerfile** :
```
Step 1/9 : FROM node:18-alpine AS builder
Step 2/9 : WORKDIR /app
Step 3/9 : COPY package*.json ./
Step 4/9 : RUN npm install
...
✓ built in Xs
Serving! - Local: http://localhost:3000
```

✅ **Si ça marche avec Nixpacks** :
```
Installing dependencies...
npm install
Building...
npm run build
Starting...
npx serve -s dist -l 3000
```

❌ **Si ça ne marche pas** :
```
npm error `npm ci` can only install packages...
```

---

## 📋 Checklist

- [ ] Builder = `Dockerfile` dans Settings → Deploy
- [ ] Start Command = **VIDE**
- [ ] Variable `VITE_API_URL` configurée
- [ ] Redéployé
- [ ] Logs montrent un build réussi

---

## 💡 Recommandation

**Utilisez le Dockerfile** (Solution 1) car :
- Plus fiable
- Plus rapide (cache Docker)
- Contrôle total sur le build

Le Dockerfile utilise déjà `npm install`, donc pas besoin de mettre à jour le `package-lock.json` immédiatement.
