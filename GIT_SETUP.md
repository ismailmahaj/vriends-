# 🔐 Configuration Git pour GitHub

## Problème : Authentification échouée

GitHub n'accepte plus les mots de passe. Il faut utiliser un **Personal Access Token (PAT)**.

---

## Solution : Créer un Personal Access Token

### Étape 1 : Créer le token sur GitHub

1. **Aller sur GitHub.com** et se connecter
2. Cliquer sur votre **avatar** (en haut à droite)
3. **Settings** → **Developer settings** (en bas à gauche)
4. **Personal access tokens** → **Tokens (classic)**
5. Cliquer sur **Generate new token** → **Generate new token (classic)**
6. **Nommer le token** : `vriends-poperinge` (ou autre nom)
7. **Sélectionner les permissions** :
   - ✅ `repo` (toutes les permissions du repo)
   - ✅ `workflow` (si vous utilisez GitHub Actions)
8. Cliquer sur **Generate token** (en bas)
9. **⚠️ IMPORTANT** : Copier le token immédiatement (ex: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Vous ne pourrez plus le voir après !

### Étape 2 : Utiliser le token

#### Option A : Utiliser le token dans l'URL (temporaire)

```bash
# Remplacer USERNAME et TOKEN
git remote set-url origin https://USERNAME:TOKEN@github.com/ismailmahaj/vriends-.git

# Exemple :
# git remote set-url origin https://ismailmahaj:ghp_xxxxxxxxxxxx@github.com/ismailmahaj/vriends-.git
```

#### Option B : Utiliser Git Credential Helper (recommandé)

```bash
# Configurer Git pour stocker les credentials
git config --global credential.helper osxkeychain

# Puis lors du push, Git vous demandera :
# Username: ismailmahaj
# Password: [collez votre token ici]
```

#### Option C : Utiliser SSH (plus sécurisé, recommandé pour long terme)

```bash
# 1. Générer une clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C "votre-email@example.com"
# Appuyer sur Entrée pour accepter le chemin par défaut
# Entrer un mot de passe (optionnel mais recommandé)

# 2. Copier la clé publique
cat ~/.ssh/id_ed25519.pub
# Copier tout le contenu affiché

# 3. Ajouter la clé sur GitHub
# - Aller sur GitHub.com → Settings → SSH and GPG keys
# - New SSH key
# - Coller la clé publique
# - Save

# 4. Changer le remote en SSH
git remote set-url origin git@github.com:ismailmahaj/vriends-.git

# 5. Tester
ssh -T git@github.com
# Devrait afficher : "Hi ismailmahaj! You've successfully authenticated..."
```

---

## Commandes pour pousser le code

Une fois l'authentification configurée :

```bash
# Vérifier le statut
git status

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Initial commit - Vriends Poperinge"

# Pousser sur GitHub
git push -u origin main

# Si la branche s'appelle "master" au lieu de "main" :
git push -u origin master
```

---

## Vérifier la configuration

```bash
# Voir les remotes configurés
git remote -v

# Voir la configuration Git
git config --list

# Configurer votre nom et email (si pas déjà fait)
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"
```

---

## Dépannage

### Erreur : "remote: Invalid username or token"

- Vérifier que le token est correct
- Vérifier que le token n'a pas expiré
- Vérifier que les permissions `repo` sont activées

### Erreur : "Permission denied (publickey)"

- Vous utilisez SSH mais la clé n'est pas ajoutée sur GitHub
- Utilisez HTTPS avec un token à la place

### Erreur : "Repository not found"

- Vérifier que le repository existe sur GitHub
- Vérifier que vous avez les droits d'accès
- Vérifier l'URL du remote : `git remote -v`

---

## Recommandation

**Pour débuter** : Utilisez l'**Option B** (credential helper) avec un token HTTPS.

**Pour la production** : Utilisez l'**Option C** (SSH) pour plus de sécurité.
