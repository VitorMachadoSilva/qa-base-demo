#!/bin/sh
set -eu

echo "Preparing QaBase database..."
node src/db/setupDatabase.js

echo "Starting QaBase..."
exec node src/server.js
