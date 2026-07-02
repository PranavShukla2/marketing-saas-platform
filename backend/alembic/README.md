# Database migrations (Alembic)

Alembic is the source of truth for schema changes. The `DATABASE_URL` env var
selects the target database (Neon Postgres in prod, SQLite locally) — it's read
in `alembic/env.py`, never hardcoded.

## Everyday use

```bash
cd backend
# after changing models in app/db/models.py:
alembic revision --autogenerate -m "describe the change"
alembic upgrade head        # apply
alembic downgrade -1        # roll back one
alembic current             # what's applied
alembic history             # all revisions
```

## First-time setup on an EXISTING database

`app/main.py` still calls `Base.metadata.create_all()` on startup (a dev
convenience), so older deploys already have the tables. Do **not** run
`upgrade head` there — it would try to re-create existing tables. Instead stamp
the DB as already at the baseline, once:

```bash
alembic stamp head
```

New migrations then apply normally on top.

## In deployment

Run `alembic upgrade head` as a release/predeploy step (before the app starts).

## TODO (see PRODUCTION-ROADMAP.md)

Remove the `create_all()` call from `main.py` once every environment is stamped,
so Alembic is the *only* thing that touches the schema.
