#!/usr/bin/env sh
set -eu

if [ ! -f .env.docker ]; then
  cp .env.docker.example .env.docker
  echo "[info] .env.docker belum ada, dibuat dari .env.docker.example"
fi

docker compose --env-file .env.docker up --build
