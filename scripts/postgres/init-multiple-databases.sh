#!/bin/bash
set -e
set -u

# Create additional databases for microservices
# Connects to postgres (maintenance DB) to create new databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE defneqr_common;
    CREATE DATABASE defneqr_qr;
    CREATE DATABASE defneqr_randevu;
    CREATE DATABASE chpistanbul;
EOSQL
