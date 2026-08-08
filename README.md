# Vriends Poperinge

Site web complet pour le café-restaurant Vriends Poperinge. Application full-stack avec React (frontend) et Node.js/Express/PostgreSQL (backend).

## Prérequis

- Node.js 18+ 
- npm ou yarn

## Structure du projet

```
vriends-poperinge/
├── backend/
│   ├── db/
│   │   └── database.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── contacts.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   ├── ordersController.js
│   │   └── contactsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimit.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Lancement

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Le backend sera accessible sur http://localhost:3001

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

## Compte administrateur par défaut

- Email : `admin@vriends.be`
- Mot de passe : `admin1234`

## Fonctionnalités

### Frontend

- **Page d'accueil** : Présentation du café avec hero section, features, menu preview
- **Authentification** : Connexion et inscription avec gestion des utilisateurs locaux
- **Menu** : Affichage des produits avec possibilité d'ajout au panier
- **Panier** : Gestion du panier avec sélection d'heure de retrait
- **Profil** : Affichage des informations utilisateur et historique des commandes
- **Dashboard admin** : Gestion des commandes, produits et contacts
- **Contact** : Formulaire de contact public avec QR code

### Backend

- **Authentification** : JWT avec bcrypt pour les mots de passe
- **Produits** : CRUD avec gestion de disponibilité
- **Commandes** : Création, consultation et gestion des statuts
- **Contacts** : Soumission publique, gestion admin avec export CSV
- **Base de données** : PostgreSQL avec Prisma

## Technologies

- **Frontend** : React 18, React Router v6, Axios, Vite
- **Backend** : Node.js, Express, Prisma, JWT, bcrypt
- **Base de données** : PostgreSQL (voir `docs/POSTGRES.md`)
- **Styles** : Inline styles (objets JavaScript)
- **Polices** : Cormorant Garamond (titres) + DM Sans (corps)

## Identité visuelle

- **Beige** : #E6DCCB (fond principal)
- **Noir** : #1C1C1C (textes, boutons)
- **Brun** : #3A2E25 (accents, titres)
- **Blanc cassé** : #F7F5F2 (cartes, panneaux)

## Notes

- PostgreSQL local via Docker : `docker compose up -d` (port **5435**)
- Migrations Prisma : `npx prisma migrate deploy` — détails dans `docs/POSTGRES.md`
- Seed ou import SQLite : `npm run db:seed` / `npm run db:migrate-from-sqlite`
- Les tokens JWT expirent après 7 jours
