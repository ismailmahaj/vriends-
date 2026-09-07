# Préparation migration Railway (P0) — NE PAS EXÉCUTER EN PRODUCTION SANS VALIDATION

## Migration

- **Nom** : `20260902120000_orders_block_address_notes_email`
- **Fichier** : `backend/prisma/migrations/20260902120000_orders_block_address_notes_email/migration.sql`

## Analyse SQL (sécurité des données)

| Opération | Risque |
|-----------|--------|
| `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (users, orders, order_items, pos_orders, pos_order_items) | Faible — additif |
| `CREATE TABLE IF NOT EXISTS email_logs` | Faible |
| `CREATE TABLE IF NOT EXISTS address_audits` | Faible |
| `INSERT INTO settings … ON CONFLICT DO NOTHING` | Faible — n’écrase pas |

**Absents (vérifié)** : `DROP`, `TRUNCATE`, suppression de colonne, `ALTER TYPE`, recréation de table, FK destructive, champ `NOT NULL` sans défaut sur tables existantes.

## Variables d’environnement (noms uniquement)

- `DATABASE_URL`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SHOP_NAME`
- `SHOP_EMAIL`
- `SHOP_PHONE`
- `SHOP_ADDRESS`

## Sauvegarde avant migration

1. Railway → service PostgreSQL → créer un backup / snapshot.
2. Ou dump local : `pg_dump "$DATABASE_URL" -Fc -f vriends-pre-migrate.dump`
3. Vérifier taille + date ; conserver hors Railway.

## Application (après validation humaine uniquement)

1. Déployer le code backend (le script `start` inclut `prisma migrate deploy`), **ou**
2. `npx prisma migrate deploy` contre Railway **seulement après accord**.
3. Vérifier `_prisma_migrations` contient la migration.
4. Tester `GET /api/settings/orders-status` et le blocage des commandes.

## Rollback non destructif

1. Rollback **code** d’abord (version précédente).
2. Les colonnes additives peuvent rester (ignorées par l’ancien code).
3. Restauration dump uniquement en dernier recours (`pg_restore`).

## Test blocage commandes

1. Dashboard → Boutique → désactiver « Accepter les commandes ».
2. Menu → bandeau visible ; panier → bouton désactivé.
3. `POST /api/orders` → `403` / `ORDERS_CLOSED`.
4. Réactiver → commande avec `cgvAccepted: true` OK.

## Interdictions

Ne pas lancer : `migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`, seed prod, deploy sans backup.
