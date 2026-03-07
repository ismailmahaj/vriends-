# 📱 Guide QR Code - Impression et Modification

## ✅ Oui, vous pouvez imprimer le QR code maintenant !

Le QR code peut être **imprimé maintenant** et **modifié plus tard** si votre nom de domaine change.

## 🔧 Comment ça fonctionne

### Option 1 : QR Code dynamique (par défaut)

**Actuellement**, le QR code utilise automatiquement l'URL du site actuel :
- Si vous êtes sur `https://vriends-frontend-production.up.railway.app` → le QR code pointe vers cette URL
- Si vous changez de domaine → le QR code pointera vers le nouveau domaine

**Avantage** : Fonctionne automatiquement, pas de configuration
**Inconvénient** : Si vous imprimez le QR code et changez de domaine, il pointera vers l'ancien domaine

### Option 2 : QR Code fixe (recommandé pour impression)

Pour **fixer l'URL du QR code** même si le domaine change :

1. **Dans Railway** → Service frontend → **Settings** → **Variables**
2. **Ajouter** :
   ```
   VITE_QR_CODE_URL=https://vriends-frontend-production.up.railway.app/contact?qr=true
   ```
   ⚠️ **Important** :
   - Utilisez l'URL **complète** avec `https://`
   - Incluez `/contact?qr=true` à la fin
   - Si vous avez un nom de domaine personnalisé, utilisez-le :
     ```
     VITE_QR_CODE_URL=https://vriends-poperinge.com/contact?qr=true
     ```

3. **Redéployer** le frontend (les variables Vite sont injectées au build)

4. **Télécharger** le nouveau QR code depuis la page Contact

## 📥 Comment télécharger le QR code

1. Aller sur la page **Contact** : `/contact`
2. Dans la carte QR Code à droite, cliquer sur **"↓ Télécharger le QR Code"**
3. Le fichier `qr-code-vriends.png` sera téléchargé
4. Vous pouvez l'imprimer !

## 🔄 Modifier l'URL du QR code plus tard

Si vous changez de nom de domaine :

1. **Modifier** la variable `VITE_QR_CODE_URL` dans Railway avec la nouvelle URL
2. **Redéployer** le frontend
3. **Télécharger** le nouveau QR code
4. **Réimprimer** si nécessaire

## 💡 Recommandation

### Pour impression immédiate :

1. **Définir** `VITE_QR_CODE_URL` avec l'URL actuelle (ou votre futur nom de domaine)
2. **Redéployer** le frontend
3. **Télécharger** et **imprimer** le QR code

### Si vous n'avez pas encore de nom de domaine définitif :

1. **Imprimez** le QR code maintenant avec l'URL Railway actuelle
2. **Quand** vous aurez votre nom de domaine personnalisé :
   - Modifiez `VITE_QR_CODE_URL` dans Railway
   - Redéployez
   - Téléchargez le nouveau QR code
   - Réimprimez si nécessaire

## 📋 Exemple de configuration Railway

```
VITE_QR_CODE_URL=https://vriends-poperinge.com/contact?qr=true
```

Ou avec l'URL Railway actuelle :

```
VITE_QR_CODE_URL=https://vriends-frontend-production.up.railway.app/contact?qr=true
```

## ⚠️ Note importante

- Les variables Vite (`VITE_*`) sont **injectées au moment du build**
- Si vous modifiez `VITE_QR_CODE_URL`, vous devez **redéployer** le frontend
- Le QR code téléchargé contient l'URL encodée dans l'image
- Une fois imprimé, le QR code ne changera pas automatiquement

## 🎯 Résumé

✅ **Oui**, vous pouvez imprimer le QR code maintenant  
✅ **Oui**, vous pouvez modifier l'URL plus tard  
✅ **Oui**, vous pouvez fixer l'URL avec `VITE_QR_CODE_URL`  
✅ **Oui**, vous devrez télécharger un nouveau QR code si vous changez l'URL
