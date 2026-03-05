# 🔧 Forcer le Rebuild avec VITE_API_URL

## Problème
Le frontend utilise toujours `http://localhost:3001` même après avoir configuré `VITE_API_URL`.

## ✅ Solution : Forcer un Rebuild Complet

### Option 1 : Via un Commit (Recommandé)

1. **Faire un petit changement** dans le code pour forcer Railway à rebuild :
   ```bash
   # Créer un fichier vide ou modifier un commentaire
   touch .rebuild
   git add .rebuild
   git commit -m "Force rebuild with VITE_API_URL"
   git push
   ```

2. **Railway détectera le changement** et rebuild automatiquement avec les nouvelles variables.

### Option 2 : Via l'Interface Railway

1. **Service frontend** → **Deployments**
2. Cliquer sur **"Redeploy"** (ou les 3 points → Redeploy)
3. **S'assurer** que "Use Cache" est **désactivé** si l'option existe
4. Attendre le rebuild complet

### Option 3 : Vérifier que la Variable est Visible

1. **Service frontend** → **Settings** → **Variables**
2. **Vérifier** que `VITE_API_URL` est bien là avec la valeur :
   ```
   https://vriends-backend-production.up.railway.app/api
   ```
3. Si elle n'est pas là, l'ajouter
4. **Sauvegarder**
5. **Redéployer**

---

## 🔍 Vérification dans les Logs

Après le rebuild, dans les logs Railway, vous devriez voir :
- Le build qui se lance
- Les variables d'environnement chargées
- Le build qui se termine avec succès

Si vous voyez des erreurs, les partager.

---

## 🐛 Si ça ne marche toujours pas

### Vérifier le Cache du Navigateur

1. **Ouvrir le frontend** en mode navigation privée
2. Ou **vider le cache** du navigateur (Cmd+Shift+R sur Mac, Ctrl+Shift+R sur Windows)
3. Tester à nouveau

### Vérifier que le Build Utilise la Variable

Dans les logs Railway, chercher si `VITE_API_URL` est mentionnée ou utilisée.

### Alternative : Hardcoder Temporairement

Si rien ne fonctionne, on peut temporairement hardcoder l'URL dans `api.js` pour tester, puis remettre la variable d'environnement.

---

## 📋 Checklist

- [ ] `VITE_API_URL` configurée dans Railway
- [ ] Frontend redéployé (via commit ou interface)
- [ ] Cache du navigateur vidé
- [ ] Testé en navigation privée
- [ ] Logs Railway vérifiés

---

## 💡 Note Importante

Les variables Vite sont injectées **au moment du BUILD**. Si le build utilise le cache, il peut utiliser l'ancienne valeur. C'est pour ça qu'il faut parfois forcer un rebuild complet.
