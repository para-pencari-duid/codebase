#!/usr/bin/env sh
set -eu

docker compose --env-file .env.docker logs -f app db
