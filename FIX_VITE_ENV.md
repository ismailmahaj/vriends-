# 🔧 Fix VITE_API_URL undefined

## Problème
`VITE_API_URL: undefined` - La variable n'est pas disponible au moment du build.

## ✅ Solution : Passer la variable au build Docker

Le Dockerfile a été modifié pour accepter `VITE_API_URL` comme argument de build.

### Étape 1 : Configurer dans Railway

1. **Service frontend** → **Settings** → **Variables**
2. **Vérifier/Modifier** `VITE_API_URL` :
   ```
   VITE_API_URL=https://vriends-backend-production.up.railway.app/api
   ```
3. **Sauvegarder**

### Étape 2 : Configurer Railway pour passer la variable au build

Railway devrait automatiquement passer les variables d'environnement au build Docker, mais parfois il faut le forcer.

**Option A : Via l'interface Railway (si disponible)**
- Dans Settings → Deploy, chercher une option pour passer les variables au build

**Option B : Via railway.json**

Créer/modifier `railway.json` à la racine :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile",
    "buildArgs": {
      "VITE_API_URL": "${VITE_API_URL}"
    }
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Étape 3 : Redéployer

1. **Commit et push** les changements :
   ```bash
   git add Dockerfile railway.json
   git commit -m "Fix VITE_API_URL in Docker build"
   git push
   ```

2. **Ou redéployer** depuis l'interface Railway

### Étape 4 : Vérifier

Après le rebuild, dans la console du navigateur, vous devriez voir :
```
🔍 VITE_API_URL: https://vriends-backend-production.up.railway.app/api
🔍 Base URL: https://vriends-backend-production.up.railway.app/api
```

---

## 🐛 Alternative : Hardcoder Temporairement (Pour tester)

Si Railway ne passe pas les variables au build, on peut temporairement hardcoder l'URL dans `api.js` :

```javascript
const api = axios.create({
  baseURL: 'https://vriends-backend-production.up.railway.app/api'
});
```

⚠️ **Attention** : C'est juste pour tester. Il faut ensuite remettre la variable d'environnement.

---

## 📋 Checklist

- [ ] `VITE_API_URL` configurée dans Railway
- [ ] Dockerfile modifié pour accepter ARG
- [ ] `railway.json` configuré (si nécessaire)
- [ ] Frontend redéployé
- [ ] Console vérifiée (VITE_API_URL n'est plus undefined)

---

## 💡 Explication

Vite a besoin des variables `VITE_*` **au moment du build**, pas au runtime. Railway doit passer ces variables au build Docker via `ARG` ou `ENV` dans le Dockerfile.

Le Dockerfile a été modifié pour accepter `VITE_API_URL` comme argument de build.
