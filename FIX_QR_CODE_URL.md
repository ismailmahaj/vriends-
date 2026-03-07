# 🔧 Fix : Changer l'URL du QR Code

## ⚠️ Problème

Vous avez modifié `VITE_QR_CODE_URL` dans Railway mais le QR code ne change pas.

## 🔍 Cause

Les variables Vite (`VITE_*`) sont **injectées au moment du BUILD**, pas au runtime. Si vous modifiez `VITE_QR_CODE_URL` dans Railway, vous devez **redéployer** le frontend pour que le changement prenne effet.

## ✅ Solution

### Étape 1 : Vérifier la variable dans Railway

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Vérifier** que `VITE_QR_CODE_URL` est bien définie :
   ```
   VITE_QR_CODE_URL=https://votre-domaine.com/contact?qr=true
   ```
   ⚠️ **Important** :
   - URL complète avec `https://`
   - Inclure `/contact?qr=true` à la fin
   - Pas d'espaces avant/après

### Étape 2 : Redéployer le frontend

**C'est l'étape cruciale !** ⚠️

1. **Railway** → Service frontend → **Deployments**
2. Cliquer sur **"Redeploy"** (ou **"Deploy"** si c'est un nouveau déploiement)
3. **Attendre** que le build se termine (2-3 minutes)

### Étape 3 : Vérifier dans la console du navigateur

1. **Ouvrir** la page Contact : `https://votre-frontend.railway.app/contact`
2. **Ouvrir** la console du navigateur (F12)
3. **Chercher** les logs :
   ```
   🔍 QR Code URL - Variables: {...}
   ✅ Utilisation de VITE_QR_CODE_URL: https://votre-domaine.com/contact?qr=true
   📱 URL finale du QR Code: https://votre-domaine.com/contact?qr=true
   ```

Si vous voyez `VITE_QR_CODE_URL: 'non définie'`, cela signifie que :
- La variable n'est pas définie dans Railway, OU
- Le frontend n'a pas été redéployé après avoir ajouté la variable

## 🐛 Dépannage

### Le QR code utilise toujours l'ancienne URL

**Cause** : Le frontend n'a pas été redéployé après modification de la variable.

**Solution** :
1. Vérifier que `VITE_QR_CODE_URL` est bien définie dans Railway
2. **Redéployer** le frontend (Deployments → Redeploy)
3. Attendre la fin du build
4. Vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
5. Recharger la page Contact

### La variable est définie mais le QR code ne change pas

**Vérifications** :
1. ✅ La variable est bien nommée `VITE_QR_CODE_URL` (avec `VITE_` au début)
2. ✅ L'URL est complète : `https://domaine.com/contact?qr=true`
3. ✅ Pas d'espaces avant/après l'URL
4. ✅ Le frontend a été **redéployé** après modification
5. ✅ Le build s'est terminé sans erreur

### Comment forcer un rebuild complet

Si le redéploiement ne fonctionne pas :

1. **Railway** → Service frontend → **Settings**
2. **Supprimer** temporairement `VITE_QR_CODE_URL`
3. **Sauvegarder** → Railway va redéployer
4. **Attendre** la fin du déploiement
5. **Remettre** `VITE_QR_CODE_URL` avec la bonne valeur
6. **Sauvegarder** → Railway va redéployer à nouveau

## 📋 Checklist

- [ ] `VITE_QR_CODE_URL` définie dans Railway avec l'URL complète
- [ ] URL correcte : `https://domaine.com/contact?qr=true`
- [ ] Frontend **redéployé** après modification
- [ ] Build terminé sans erreur
- [ ] Console du navigateur vérifiée (logs visibles)
- [ ] Cache du navigateur vidé
- [ ] QR code téléchargé et vérifié

## 💡 Exemple de configuration

### Pour utiliser l'URL Railway actuelle :
```
VITE_QR_CODE_URL=https://vriends-frontend-production.up.railway.app/contact?qr=true
```

### Pour utiliser un domaine personnalisé :
```
VITE_QR_CODE_URL=https://vriends-poperinge.com/contact?qr=true
```

### Pour le développement local :
Ne pas définir `VITE_QR_CODE_URL` (le code utilisera automatiquement `localhost`)

## 🎯 Résumé

**Règle d'or** : Toute modification de `VITE_QR_CODE_URL` nécessite un **redéploiement** du frontend.

Les variables Vite sont injectées au BUILD, pas au runtime. C'est normal et c'est ainsi que Vite fonctionne.
