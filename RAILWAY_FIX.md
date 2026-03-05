# 🔧 Fix Railway - Solution Définitive

## Problème
Railway essaie de builder depuis la racine au lieu de `backend/`.

## ✅ Solution 1 : Configuration dans l'Interface Railway (À FAIRE EN PREMIER)

### Étapes détaillées :

1. **Aller sur railway.app** → Votre projet → Service backend

2. **Cliquer sur les 3 points** (⋯) → **Settings**

3. **Section "Source"** :
   - **Root Directory** : Tapez exactement `backend` (sans slash)
   - **Build Command** : Laissez VIDE (Railway détectera automatiquement)
   - **Start Command** : `npm start`

4. **Section "Variables"** - Ajouter :
   ```
   PORT=3001
   JWT_SECRET=votre_secret_jwt_tres_securise_123456789
   DB_PATH=./db/vriends.db
   FRONTEND_URL=https://votre-frontend.railway.app
   NODE_ENV=production
   ```

5. **Sauvegarder** (bouton en bas)

6. **Aller dans "Deployments"** → Cliquer sur **"Redeploy"** ou faire un nouveau commit

---

## ✅ Solution 2 : Utiliser Dockerfile (Si Solution 1 ne marche pas)

Un `Dockerfile` a été créé dans `backend/Dockerfile`. Railway détectera automatiquement Docker.

**Important** : Si vous utilisez Dockerfile, Railway ignorera le Root Directory. Le Dockerfile doit être dans `backend/`.

### Pour activer Docker :
1. Dans Railway → Settings → **Deploy**
2. **Builder** : Sélectionner "Dockerfile"
3. Railway devrait détecter `backend/Dockerfile` automatiquement

---

## ✅ Solution 3 : Créer un Nouveau Service (Si rien ne marche)

### Supprimer et recréer :

1. **Supprimer le service actuel** (Settings → Delete Service)

2. **Créer un nouveau service** :
   - "Empty Service" ou "GitHub Repo"
   - **IMPORTANT** : Dès la création, aller dans Settings
   - **Root Directory** : `backend`
   - **Start Command** : `npm start`

3. **Ajouter les variables d'environnement**

4. **Déployer**

---

## 🔍 Vérification

### Vérifier que ça fonctionne :

1. **Logs Railway** : Aller dans "Deployments" → Cliquer sur le dernier déploiement
2. **Chercher dans les logs** :
   - ✅ `npm ci` devrait s'exécuter dans `backend/`
   - ✅ `npm start` devrait démarrer `server.js`
   - ❌ Ne devrait PAS voir d'erreur "Cannot find package.json"

### Si vous voyez encore l'erreur :

```
npm error A complete log of this run can be found in: /root/.npm/_logs/...
```

Cela signifie que Railway essaie toujours de builder depuis la racine.

**Solution** : Utiliser la Solution 3 (recréer le service avec le bon Root Directory).

---

## 📝 Structure Attendu par Railway

```
vriends-poperinge-frontend/          ← Repository GitHub
├── backend/                          ← Root Directory du service backend
│   ├── package.json                  ← Railway cherche ce fichier
│   ├── package-lock.json
│   ├── server.js
│   ├── Dockerfile                    ← Optionnel (si Docker)
│   └── ...
├── src/                              ← Frontend (service séparé)
└── package.json                      ← Frontend package.json
```

---

## 🚨 Erreurs Courantes

### Erreur : "Cannot find package.json"
**Cause** : Root Directory mal configuré
**Fix** : Vérifier que Root Directory = `backend` (exactement, sans slash)

### Erreur : "npm ci failed"
**Cause** : package-lock.json manquant ou corrompu
**Fix** : 
```bash
cd backend
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Fix package-lock.json"
git push
```

### Erreur : "Port already in use"
**Cause** : Port hardcodé
**Fix** : Vérifier que `server.js` utilise `process.env.PORT || 3001`

---

## ✅ Checklist Finale

- [ ] Root Directory = `backend` dans Settings
- [ ] Variables d'environnement configurées
- [ ] package-lock.json existe dans `backend/`
- [ ] Redéployé après changement de configuration
- [ ] Logs montrent que le build se fait dans `backend/`

---

## 💡 Astuce

**Pour tester localement** avant de déployer :

```bash
cd backend
npm ci
npm start
```

Si ça marche localement, ça devrait marcher sur Railway avec la bonne configuration.
