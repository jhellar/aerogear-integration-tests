export KEYCLOAK_HOST=bs-local.com
export KEYCLOAK_PORT=8080
export SYNC_HOST=bs-local.com
export SYNC_PORT=4000
export METRICS_HOST=bs-local.com
export METRICS_PORT=3000
export PGHOST=localhost
export PGUSER=postgresql
export PGPASSWORD=postgres
export PGDATABASE=aerogear_mobile_metrics
export BROWSERSTACK_APP=$(cat "./testing-app/bs-app-url.txt" | cut -d '"' -f 4)