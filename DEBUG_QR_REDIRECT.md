# 🔧 Dépannage : QR Code ne redirige pas vers la nouvelle URL

## 🔍 Vérification étape par étape

### Étape 1 : Vérifier que l'URL est bien sauvegardée

1. **Dashboard** → Onglet "Contacts & Leads"
2. **Vérifier** l'URL affichée dans "URL de destination"
3. **Modifier** l'URL si nécessaire et **sauvegarder**
4. **Vérifier** que le message "✅ URL du QR Code mise à jour avec succès !" s'affiche

### Étape 2 : Tester la redirection directement

1. **Ouvrir** dans le navigateur : `https://votre-frontend.railway.app/qr-redirect`
2. **Ouvrir** la console (F12)
3. **Vérifier** les logs :
   ```
   🔍 QRRedirectPage: Chargement de l'URL depuis l'API...
   🔍 QRRedirectPage: URL récupérée: https://votre-nouvelle-url.com/contact?qr=true
   ✅ QRRedirectPage: Redirection vers URL externe: https://...
   ```

### Étape 3 : Vérifier les logs backend

Dans les logs Railway du backend, vous devriez voir :
```
✅ Setting qr_code_url récupérée: https://votre-nouvelle-url.com/contact?qr=true
```

### Étape 4 : Tester avec le QR code

1. **Scanner** le QR code (ou ouvrir `/qr-redirect`)
2. **Vérifier** que la redirection fonctionne vers la nouvelle URL
3. **Vérifier** la console du navigateur pour les logs

## 🐛 Problèmes courants

### Problème 1 : L'URL ne change pas dans la base de données

**Symptôme** : Vous modifiez l'URL dans le dashboard mais la redirection pointe toujours vers l'ancienne URL.

**Solution** :
1. Vérifier les logs backend lors de la sauvegarde
2. Vérifier que le message de succès s'affiche dans le dashboard
3. Vérifier directement dans la base de données (si possible)

### Problème 2 : La redirection ne fonctionne pas

**Symptôme** : L'URL est bien récupérée mais la redirection ne se fait pas.

**Solution** :
1. Vérifier la console du navigateur pour les erreurs
2. Vérifier que l'URL est bien formatée (commence par `http://` ou `https://`)
3. Vérifier que l'URL n'est pas bloquée par le navigateur (popup blocker)

### Problème 3 : Cache du navigateur

**Symptôme** : L'ancienne redirection est toujours active.

**Solution** :
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Tester en mode incognito (Ctrl+Shift+N)
3. Forcer le rechargement (Ctrl+Shift+R)

## ✅ Test complet

1. **Dashboard** → Modifier l'URL vers : `https://greatly.be/contact?qr=true`
2. **Sauvegarder** → Vérifier le message de succès
3. **Ouvrir** : `https://votre-frontend.railway.app/qr-redirect`
4. **Vérifier** la console : l'URL récupérée doit être `https://greatly.be/contact?qr=true`
5. **Vérifier** la redirection : vous devez être redirigé vers `https://greatly.be/contact?qr=true`

## 📋 Checklist

- [ ] URL modifiée dans le dashboard
- [ ] Message de succès affiché
- [ ] Logs backend montrent la mise à jour
- [ ] `/qr-redirect` charge bien la nouvelle URL depuis l'API
- [ ] Redirection fonctionne vers la nouvelle URL
- [ ] Cache du navigateur vidé
- [ ] Testé avec le QR code réel

## 💡 Note importante

Le QR code pointe toujours vers `/qr-redirect` (URL fixe). Cette page charge l'URL depuis l'API à chaque fois et redirige automatiquement. Donc même si vous changez l'URL dans le dashboard, le QR code imprimé continuera de fonctionner et redirigera vers la nouvelle URL.
