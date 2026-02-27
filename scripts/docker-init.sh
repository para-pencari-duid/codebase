#!/usr/bin/env sh
set -eu

docker compose --env-file .env.docker exec app npx prisma migrate deploy
docker compose --env-file .env.docker exec app node prisma/seed.js
