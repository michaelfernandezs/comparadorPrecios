#!/bin/sh
set -e

if [ "$MODE" = "job" ]; then
  echo "[entrypoint] MODE=job -> ejecutando actualizaciÃ³n de precios y saliendo"
  exec npm run start:job
else
  echo "[entrypoint] Iniciando servidor API"
  exec npm run start:prod
fi
