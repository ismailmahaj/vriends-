# 🔧 Fix : Container failed to start

## Problème
Railway essaie d'exécuter `cd backend && npm start` mais `cd` n'existe pas dans le conteneur Docker.

## ✅ Solution

Le `railway.json` a été modifié pour **supprimer le startCommand** car le Dockerfile définit déjà la commande de démarrage avec `CMD ["npm", "start"]`.

### Sur Railway :

1. **Settings** → **Deploy**
2. **Start Command** : **LAISSER VIDE** (le Dockerfile gère déjà ça)
3. **Sauvegarder**
4. **Redéployer**

---

## 🔍 Pourquoi ça ne marche pas ?

Quand vous utilisez un Dockerfile, la commande `CMD` dans le Dockerfile est la commande de démarrage. Si vous ajoutez aussi un `startCommand` dans Railway, ça crée un conflit.

Le Dockerfile contient déjà :
```dockerfile
CMD ["npm", "start"]
```

Donc Railway n'a pas besoin d'un `startCommand` supplémentaire.

---

## ✅ Vérification

Dans les logs Railway, vous devriez voir :
```
🚀 Backend running on http://localhost:3001
```

Au lieu de :
```
The executable `cd` could not be found.
```

---

## 📝 Configuration Finale

### Railway Settings :
- **Builder** : Dockerfile
- **Dockerfile Path** : `backend/Dockerfile` (ou vide si auto-détecté)
- **Start Command** : **VIDE** (important !)
- **Root Directory** : `backend` (si pas Dockerfile)

### Variables d'environnement :
```
PORT=3001
JWT_SECRET=votre_secret_jwt_tres_securise
DB_PATH=./db/vriends.db
FRONTEND_URL=https://votre-frontend.railway.app
NODE_ENV=production
```
