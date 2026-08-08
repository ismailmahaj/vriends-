# PostgreSQL — Vriends Backend

## Local

```bash
# 1. Démarrer Postgres (port 5435 pour éviter un Postgres système sur 5432)
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env   # si besoin
npm install
npx prisma migrate deploy
npm run db:seed
# OU migrer les données SQLite existantes :
npm run db:migrate-from-sqlite

npm run dev
```

`DATABASE_URL` attendue :

```
postgresql://vriends:vriends@127.0.0.1:5435/vriends
```

## Railway (prod)

1. Ajouter le plugin **PostgreSQL**
2. Copier la variable `DATABASE_URL` vers le service backend
3. **Supprimer** `DB_PATH` / volume SQLite
4. Redéployer — `postinstall` lance `prisma generate`, le start peut être :

```
npx prisma migrate deploy && node server.js
```

## Notes

- SQLite (`backend/db/vriends.db`) n’est plus utilisé par l’API
- `better-sqlite3` reste uniquement pour le script `db:migrate-from-sqlite`
- Le pricing engine backend est dans `backend/lib/pricingEngine.cjs` (copie déployable ; le frontend utilise `src/lib/pricingEngine.js`)
