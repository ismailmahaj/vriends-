# 🔧 Fix : VITE_QR_CODE_URL non détectée

## ⚠️ Problème

La variable `VITE_QR_CODE_URL` est définie dans Railway mais le code affiche "non définie" dans les logs.

## 🔍 Causes possibles

1. **Guillemets dans la valeur** : Railway n'aime pas les guillemets
2. **Frontend non redéployé** : Les variables Vite sont injectées au BUILD
3. **Format incorrect** : L'URL doit être complète

## ✅ Solution étape par étape

### Étape 1 : Vérifier le format dans Railway

**❌ MAUVAIS** (avec guillemets) :
```
VITE_QR_CODE_URL="https://greatly.be/"
```

**✅ BON** (sans guillemets) :
```
VITE_QR_CODE_URL=https://greatly.be/contact?qr=true
```

### Étape 2 : Configurer correctement dans Railway

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Modifier** `VITE_QR_CODE_URL` :
   - **Clé** : `VITE_QR_CODE_URL`
   - **Valeur** : `https://greatly.be/contact?qr=true`
   - ⚠️ **SANS guillemets** autour de la valeur
   - ⚠️ **Avec** `/contact?qr=true` à la fin
3. **Sauvegarder**

### Étape 3 : Redéployer le frontend

**C'est l'étape la plus importante !** ⚠️

1. **Railway** → Service frontend → **Deployments**
2. Cliquer sur **"Redeploy"** (ou **"Deploy"**)
3. **Attendre** que le build se termine (2-3 minutes)
4. Vérifier que le build s'est terminé **sans erreur**

### Étape 4 : Vérifier dans la console

1. **Ouvrir** : `https://vriends-frontend-production.up.railway.app/contact`
2. **Ouvrir** la console (F12)
3. **Chercher** les logs :
   ```
   🔍 QR Code URL - Debug: {
     "VITE_QR_CODE_URL (raw)": "https://greatly.be/contact?qr=true",
     "VITE_QR_CODE_URL (type)": "string",
     ...
   }
   ✅ Utilisation de VITE_QR_CODE_URL (nettoyée): https://greatly.be/contact?qr=true
   📱 URL finale du QR Code: https://greatly.be/contact?qr=true
   ```

## 🐛 Si ça ne marche toujours pas

### Vérification 1 : La variable est-elle dans la liste ?

Dans la console, chercher :
```
Toutes les variables VITE_*: ["VITE_API_URL", "VITE_QR_CODE_URL"]
```

Si `VITE_QR_CODE_URL` n'apparaît pas, la variable n'a pas été injectée au build.

### Vérification 2 : Forcer un rebuild complet

1. **Railway** → Service frontend → **Settings** → **Variables**
2. **Supprimer** temporairement `VITE_QR_CODE_URL`
3. **Sauvegarder** → Railway redéploie
4. **Attendre** la fin du déploiement
5. **Remettre** `VITE_QR_CODE_URL` avec la bonne valeur (sans guillemets)
6. **Sauvegarder** → Railway redéploie à nouveau

### Vérification 3 : Vérifier les logs Railway

1. **Railway** → Service frontend → **Deployments** → Dernier déploiement
2. **Vérifier** les logs du build
3. **Chercher** des erreurs ou warnings

## 📋 Format correct

### Pour votre domaine `greatly.be` :
```
VITE_QR_CODE_URL=https://greatly.be/contact?qr=true
```

### Pour l'URL Railway actuelle :
```
VITE_QR_CODE_URL=https://vriends-frontend-production.up.railway.app/contact?qr=true
```

### ⚠️ Règles importantes :
- ❌ **PAS de guillemets** autour de la valeur
- ✅ URL complète avec `https://`
- ✅ Inclure `/contact?qr=true` à la fin
- ✅ Pas d'espaces avant/après

## 💡 Le code a été amélioré

Le code détecte maintenant automatiquement :
- Les guillemets et les enlève
- Les URLs incomplètes et ajoute `/contact?qr=true` si nécessaire
- Affiche plus de logs pour déboguer

Mais **vous devez quand même redéployer** après avoir modifié la variable !

## 🎯 Résumé

1. ✅ Enlever les guillemets de la valeur dans Railway
2. ✅ Mettre l'URL complète : `https://greatly.be/contact?qr=true`
3. ✅ **Redéployer** le frontend
4. ✅ Vérifier dans la console du navigateur
