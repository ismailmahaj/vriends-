# Audit POS — Caisse intelligente Vriends Poperinge

Date : 2026-08-09  
Statut : aucun blocage critique — implémentation autorisée

---

## 1. Ce qui existe

### Stack active
- **Frontend** : React 19 + Vite (JSX) à la racine (`src/`), pas de dossier `frontend/`
- **Backend** : Express + `better-sqlite3` dans `backend/`
- **DB** : SQLite (`backend/db/vriends.db`), schéma via `CREATE TABLE IF NOT EXISTS` (pas de migrations versionnées)
- **Auth** : JWT Bearer, rôles `client` | `admin`
- **Design** : beige `#E6DCCB`, brun `#3A2E25`, noir `#1C1C1C`, blanc cassé `#F7F5F2` ; fonts Cormorant Garamond + DM Sans

### Réutilisable
| Élément | Fichiers |
|---------|----------|
| Auth JWT + garde admin | `backend/middleware/auth.js`, `AuthContext.jsx`, `ProtectedRoute.jsx` |
| Catalogue produits + `available` | `products` table, `productsController.js`, `MenuPage.jsx` |
| Panier localStorage | `CartContext.jsx` (logique inspirante, panier POS séparé) |
| Commandes + snapshot prix unitaire | `orders` / `order_items` (click & collect — **ne pas casser**) |
| Settings key/value | `settings` table, `settingsController.js` |
| Remise résident partielle | `users.local_status` + `discount_percent` (click & collect) |
| Proxy Vite `/api` → `:3001` | `vite.config.js` |

### Hors scope / inactif
- `src/**/*.tsx` et services TS : legacy, non branchés
- `vriends-backend/` : Prisma vide — **ignoré**

---

## 2. Ce qui manque (avant POS)

- UI caisse plein écran `/pos`
- Rôles `cashier` / `manager`
- Types client caisse : STANDARD / RESIDENT / WORKER
- Moteur de prix centralisé (centimes) + Vroege Vogel / majoration 11h
- Catégories, favoris, recherche POS
- Tables `pos_orders` / `pos_order_items` (séparées du click & collect)
- Paiements CASH / CARD / OTHER + rendu monnaie
- Hold / resume, ticket thermique, stats caisse
- Paramètres caisse configurables en DB
- Idempotency anti double paiement
- Tests pricing

---

## 3. Décisions d’architecture

1. **Commandes POS isolées** des commandes click & collect (`orders`) pour ne rien casser.
2. **Pricing engine partagé** dans `shared/pricingEngine.js` (centimes, règles testables).
3. **Recalcul serveur obligatoire** à la validation — le frontend n’est qu’affichage.
4. **Pourcentages indépendants sur le sous-total** :
   - remise client % du sous-total
   - early bird % du sous-total (si avant heure limite)
   - majoration % du sous-total (si ≥ heure début)
   - `total = subtotal - discounts + surcharge`
5. **Heure serveur** pour les règles à l’encaissement (sécurité).
6. **Persistence panier** : `localStorage` clé `vriends_pos_draft`.

---

## 4. Fichiers à créer / modifier

### Créer
- `docs/POS_AUDIT.md` (ce fichier)
- `shared/pricingEngine.cjs`
- `backend/tests/pricingEngine.test.js`
- `backend/routes/pos.js`
- `backend/controllers/posController.js`
- `backend/services/paymentProvider.js`
- `src/lib/pricingEngine.js`
- `src/services/posService.js`
- `src/pos/*` (pages, context, composants, CSS)

### Modifier
- `backend/db/database.js` — tables POS + colonnes produits + seed settings
- `backend/middleware/auth.js` — `staffMiddleware`, `managerMiddleware`
- `backend/server.js` — monter `/api/pos`
- `backend/package.json` — script `test`
- `vite.config.js` — alias `@shared`
- `src/App.jsx` — routes `/pos`, `/pos/orders`
- `src/context/AuthContext.jsx` — `isStaff`, `canManagePos`
- `src/components/ProtectedRoute.jsx` — `staffOnly`
- `src/components/Navbar.jsx` — lien Caisse, masquage sur `/pos`
- `src/pages/DashboardPage.jsx` — onglet Paramètres caisse

---

## 5. Migrations DB nécessaires

Nouvelles tables :
- `pos_orders`
- `pos_order_items`

Colonnes produits (si absentes) :
- `category`, `image_url`, `is_favorite`, `sku`, `options_schema`

Settings POS (clés) :
- `pos_resident_discount_percent`
- `pos_worker_discount_percent`
- `pos_early_bird_discount_percent`
- `pos_early_bird_end_time`
- `pos_late_surcharge_percent`
- `pos_late_surcharge_start_time`
- `pos_shop_name`, `pos_shop_address`

Approche : `CREATE TABLE IF NOT EXISTS` + helper `ensureColumn` (pas de framework de migration).

---

## 6. Endpoints POS

| Méthode | Route | Accès |
|---------|-------|-------|
| GET | `/api/pos/products` | staff |
| GET | `/api/pos/categories` | staff |
| GET | `/api/pos/settings` | staff |
| PUT | `/api/pos/settings` | admin/manager |
| POST | `/api/pos/products/:id/favorite` | staff |
| POST | `/api/pos/orders` | staff (checkout ou hold) |
| GET | `/api/pos/orders` | staff |
| GET | `/api/pos/orders/:id` | staff |
| POST | `/api/pos/orders/:id/payment` | staff |
| POST | `/api/pos/orders/:id/hold` | staff |
| POST | `/api/pos/orders/:id/resume` | staff |
| GET | `/api/pos/stats` | admin/manager |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Casser click & collect | Tables POS séparées, ne pas modifier `ordersController` métier |
| Double stack TS/JSX | Implémenter uniquement en JSX |
| Décimales JS | Tout en centimes |
| Double paiement | `idempotency_key` UNIQUE + verrou statut |
| SQLite concurrent | Transactions sync `better-sqlite3` |
| Navbar sur caisse | Masquer sur routes `/pos*` |

---

## 8. Conclusion

Le socle actuel (auth, produits, settings, design) suffit pour bâtir une caisse professionnelle sans réécriture.  
**Aucun blocage critique** → passage automatique aux phases 2–8.
