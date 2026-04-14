#!/bin/sh
set -e

# Remplace le placeholder __VITE_API_URL__ par la valeur de l'env var VITE_API_URL
# dans tous les fichiers JS buildés par Vite (le placeholder a été injecté au build)
find /usr/share/nginx/html -name "*.js" | while read file; do
  sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" "$file"
done

echo "VITE_API_URL set to: ${VITE_API_URL}"

exec "$@"
