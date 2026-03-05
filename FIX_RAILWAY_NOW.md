# 🔧 FIX IMMÉDIAT - Railway

## Problème
Railway essaie de faire `npm ci` depuis la racine et le `package-lock.json` n'est pas synchronisé.

## ✅ SOLUTION IMMÉDIATE

### Étape 1 : Sur Railway - Configurer Dockerfile

1. **Ouvrir votre service backend** sur Railway
2. **Settings** (⚙️) → **Deploy**
3. **Builder** : Sélectionner **"Dockerfile"**
4. **Dockerfile Path** : `backend/Dockerfile` (ou laisser vide si Railway le détecte)
5. **Sauvegarder**

### Étape 2 : Variables d'environnement

**Settings** → **Variables** :

```
PORT=3001
JWT_SECRET=votre_secret_jwt_tres_securise_123456789
DB_PATH=./db/vriends.db
FRONTEND_URL=https://votre-frontend.railway.app
NODE_ENV=production
```

### Étape 3 : Redéployer

1. **Deployments** → Cliquer sur **"Redeploy"**
2. Ou faire un commit et push (Railway redéploiera automatiquement)

---

## 🔍 Pourquoi ça va marcher maintenant ?

Le `Dockerfile` a été modifié pour utiliser `npm install` au lieu de `npm ci`, ce qui évite le problème de synchronisation du `package-lock.json`.

Le `Dockerfile` force Railway à builder depuis `backend/` et utilise le bon `package.json` et `package-lock.json`.

---

## ⚠️ Si Railway ne détecte pas le Dockerfile

1. **Settings** → **Deploy**
2. **Dockerfile Path** : Entrer manuellement `backend/Dockerfile`
3. **Sauvegarder** et **Redéployer**

---

## 📋 Checklist

- [ ] Builder = "Dockerfile" dans Settings
- [ ] Dockerfile Path = `backend/Dockerfile` (ou détecté automatiquement)
- [ ] Variables d'environnement configurées
- [ ] Redéployé
- [ ] Logs montrent un build réussi

---

## 🎯 Alternative : Mettre à jour package-lock.json localement

Si vous voulez utiliser `npm ci` au lieu de `npm install`, exécutez localement :

```bash
cd backend
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

Mais le Dockerfile avec `npm install` devrait fonctionner immédiatement.
