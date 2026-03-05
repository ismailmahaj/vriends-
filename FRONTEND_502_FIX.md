# 🔧 Fix Erreur 502 - Frontend

## Problème
Erreur 502 sur le frontend = Le serveur ne répond pas.

## ✅ Solutions

### Solution 1 : Vérifier les Logs Railway (PRIORITAIRE)

1. **Service frontend** → **Deployments**
2. **Dernier déploiement** → **Logs**
3. **Chercher** :
   - ✅ `Serving! - Local: http://localhost:3000` → Ça marche
   - ❌ Erreurs de build
   - ❌ Erreurs de port
   - ❌ Erreurs de serve

**Copier les dernières lignes d'erreur** et les partager.

---

### Solution 2 : Vérifier le Port

Railway assigne automatiquement un port via `PORT`. Le Dockerfile doit utiliser `process.env.PORT`.

**Problème potentiel** : Le Dockerfile utilise un port fixe `3000`.

**Solution** : Modifier le Dockerfile pour utiliser `$PORT` ou `process.env.PORT`.

---

### Solution 3 : Vérifier que le Build a Réussi

Dans les logs Railway, chercher :
- ✅ `✓ built in Xs` → Build réussi
- ❌ Erreurs TypeScript
- ❌ Erreurs de build

Si le build échoue, le serveur ne peut pas démarrer.

---

### Solution 4 : Vérifier les Variables d'Environnement

**Frontend** (Settings → Variables) :
```
VITE_API_URL=https://vriends-backend-production.up.railway.app/api
```

⚠️ **Important** :
- Si `VITE_API_URL` est incorrect, le build peut échouer
- Mais généralement, ça ne cause pas une 502

---

### Solution 5 : Vérifier le Dockerfile

Le Dockerfile doit :
1. Builder correctement l'app
2. Installer `serve`
3. Démarrer `serve` sur le bon port

---

## 🔍 Diagnostic Étape par Étape

### Étape 1 : Vérifier le Statut du Service

Dans Railway :
- Le service frontend est-il **"Online"** ou **"Crashed"** ?
- Si "Crashed", voir les logs

### Étape 2 : Vérifier les Logs

**Chercher dans les logs** :
- Messages de build
- Messages de démarrage de serve
- Erreurs

### Étape 3 : Tester le Build Localement

```bash
cd /Users/ismailmahaj/vriends/vriends-poperinge-frontend
npm install
npm run build
npx serve -s dist -l 3000
```

Si ça marche localement, le problème est dans la configuration Railway.

---

## 🐛 Erreurs Courantes

### Erreur : "Port already in use"

**Cause** : Port hardcodé

**Solution** : Utiliser `$PORT` dans le Dockerfile

### Erreur : "Cannot find module 'serve'"

**Cause** : `serve` non installé

**Solution** : Le Dockerfile installe déjà `serve` globalement

### Erreur : "dist directory not found"

**Cause** : Build échoué

**Solution** : Vérifier les erreurs de build dans les logs

---

## 📋 Checklist

- [ ] Logs Railway consultés
- [ ] Service frontend "Online" (pas "Crashed")
- [ ] Build réussi dans les logs
- [ ] `serve` démarre dans les logs
- [ ] Variables d'environnement configurées
- [ ] Dockerfile correct

---

## 🆘 Solution de Dernier Recours

Si rien ne fonctionne :

1. **Voir les logs Railway** (le plus important !)
2. **Copier les erreurs**
3. **Vérifier chaque étape** :
   - Build réussi ?
   - Serve démarre ?
   - Port correct ?

Les logs Railway contiennent toutes les informations nécessaires.
