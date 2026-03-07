# 🔧 Dépannage : VITE_QR_CODE_URL non détectée

## ⚠️ Problème

La variable `VITE_QR_CODE_URL` est définie dans Railway mais les logs montrent :
```json
{
  "VITE_QR_CODE_URL": "non définie"
}
```

## 🔍 Diagnostic étape par étape

### Étape 1 : Vérifier dans Railway

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Vérifier** que `VITE_QR_CODE_URL` existe bien dans la liste
3. **Vérifier** le format :
   - ✅ **BON** : `VITE_QR_CODE_URL=https://greatly.be/contact?qr=true`
   - ❌ **MAUVAIS** : `VITE_QR_CODE_URL="https://greatly.be/"`
   - ❌ **MAUVAIS** : `VITE_QR_CODE_URL=https://greatly.be/` (sans `/contact?qr=true`)

### Étape 2 : Vérifier les logs Railway du build

1. **Railway** → Service frontend → **Deployments**
2. **Cliquer** sur le dernier déploiement
3. **Vérifier** les logs du build
4. **Chercher** si la variable est mentionnée ou s'il y a des erreurs

### Étape 3 : Vérifier dans la console du navigateur

Après avoir ouvert la page Contact, dans la console (F12), chercher :

```javascript
🔍 QR Code URL - Debug: {
  "VITE_QR_CODE_URL (raw)": ...,
  "Toutes les variables VITE_*": [...]
}
```

**Si `"Toutes les variables VITE_*"` ne contient pas `"VITE_QR_CODE_URL"`** :
→ La variable n'a pas été injectée au build
→ Il faut redéployer le frontend

**Si `"Toutes les variables VITE_*"` contient `"VITE_QR_CODE_URL"` mais la valeur est `undefined`** :
→ La variable est définie mais vide ou mal formatée
→ Vérifier le format dans Railway

## ✅ Solution : Redéploiement complet

### Méthode 1 : Redéploiement simple

1. **Railway** → Service frontend → **Deployments**
2. **Cliquer** sur **"Redeploy"**
3. **Attendre** 2-3 minutes que le build se termine
4. **Vérifier** que le build s'est terminé sans erreur
5. **Recharger** la page Contact et vérifier la console

### Méthode 2 : Forcer un rebuild complet

Si le redéploiement simple ne fonctionne pas :

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Supprimer** temporairement `VITE_QR_CODE_URL`
3. **Sauvegarder** → Railway va redéployer
4. **Attendre** la fin du déploiement (vérifier dans Deployments)
5. **Remettre** `VITE_QR_CODE_URL` avec la bonne valeur :
   ```
   VITE_QR_CODE_URL=https://greatly.be/contact?qr=true
   ```
6. **Sauvegarder** → Railway va redéployer à nouveau
7. **Attendre** la fin du déploiement
8. **Vérifier** dans la console du navigateur

### Méthode 3 : Commit + Push (si vous utilisez Git)

1. **Faire un commit** (même vide) :
   ```bash
   git commit --allow-empty -m "Force rebuild for VITE_QR_CODE_URL"
   git push
   ```
2. Railway va automatiquement redéployer
3. **Attendre** la fin du build
4. **Vérifier** dans la console

## 📋 Format correct de la variable

### Dans Railway → Settings → Variables :

**Clé** : `VITE_QR_CODE_URL`

**Valeur** (sans guillemets) :
```
https://greatly.be/contact?qr=true
```

### Règles importantes :

- ❌ **PAS de guillemets** autour de la valeur
- ✅ URL complète avec `https://`
- ✅ Inclure `/contact?qr=true` à la fin
- ✅ Pas d'espaces avant/après
- ✅ Pas de caractères spéciaux non encodés

## 🔍 Vérification finale

Après redéploiement, dans la console du navigateur, vous devriez voir :

```javascript
🔍 QR Code URL - Debug: {
  "VITE_QR_CODE_URL (raw)": "https://greatly.be/contact?qr=true",
  "VITE_QR_CODE_URL (type)": "string",
  "Toutes les variables VITE_*": ["VITE_API_URL", "VITE_QR_CODE_URL"]
}
✅ Utilisation de VITE_QR_CODE_URL (nettoyée): https://greatly.be/contact?qr=true
📱 URL finale du QR Code: https://greatly.be/contact?qr=true
```

## 🐛 Si ça ne marche toujours pas

### Vérification 1 : La variable est-elle dans la liste Railway ?

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Vérifier** que `VITE_QR_CODE_URL` apparaît bien dans la liste
3. **Vérifier** qu'il n'y a pas de doublons ou de variantes (espaces, majuscules/minuscules)

### Vérification 2 : Le build s'est-il bien terminé ?

1. **Railway** → Service frontend → **Deployments**
2. **Vérifier** que le dernier déploiement est **"Active"** (vert)
3. **Vérifier** qu'il n'y a pas d'erreurs dans les logs

### Vérification 3 : Le cache du navigateur

1. **Vider** le cache du navigateur (Ctrl+Shift+Delete)
2. **Recharger** la page en mode incognito (Ctrl+Shift+N)
3. **Vérifier** la console

### Vérification 4 : Vérifier que VITE_API_URL fonctionne

Si `VITE_API_URL` fonctionne mais pas `VITE_QR_CODE_URL`, c'est étrange. Vérifier :
1. Le format exact de la variable
2. S'il n'y a pas de caractères invisibles
3. Si le nom de la variable est exactement `VITE_QR_CODE_URL` (avec underscore, pas de tiret)

## 💡 Astuce : Tester avec une valeur simple

Pour tester si le problème vient du format de l'URL :

1. **Temporairement**, mettre une valeur simple :
   ```
   VITE_QR_CODE_URL=test123
   ```
2. **Redéployer** le frontend
3. **Vérifier** dans la console si `"VITE_QR_CODE_URL (raw)": "test123"` apparaît
4. Si oui → le problème vient du format de l'URL
5. Si non → le problème vient de l'injection de la variable

## 🎯 Checklist complète

- [ ] `VITE_QR_CODE_URL` existe dans Railway → Settings → Variables
- [ ] Format correct : `https://greatly.be/contact?qr=true` (sans guillemets)
- [ ] Frontend **redéployé** après avoir ajouté/modifié la variable
- [ ] Build terminé sans erreur (vérifier dans Deployments)
- [ ] Console du navigateur vérifiée (logs visibles)
- [ ] `"Toutes les variables VITE_*"` contient `"VITE_QR_CODE_URL"`
- [ ] Cache du navigateur vidé
- [ ] Page rechargée

## 📞 Si rien ne fonctionne

Si après toutes ces étapes, la variable n'est toujours pas détectée :

1. **Vérifier** que vous êtes bien sur le bon service Railway (frontend, pas backend)
2. **Vérifier** que le code a bien été déployé (vérifier la date du dernier commit)
3. **Créer un ticket** sur Railway avec les logs du build
