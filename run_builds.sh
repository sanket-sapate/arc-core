set -e
docker build --build-arg SERVICE=discovery-service --build-arg CMD=api -t arc/discovery-service:latest .
echo "discovery done"
docker build --build-arg SERVICE=privacy-service --build-arg CMD=api -t arc/privacy-service:latest .
echo "privacy done"
docker build --build-arg SERVICE=trm-service --build-arg CMD=api -t arc/trm-service:latest .
echo "trm done"
docker build --build-arg SERVICE=audit-service --build-arg CMD=api -t arc/audit-service:latest .
echo "audit done"
docker build --build-arg SERVICE=abc-service --build-arg CMD=api -t arc/abc-service:latest .
echo "abc done"

docker compose -f infra/prod/docker-compose.yml up -d --force-recreate discovery-service privacy-service trm-service audit-service abc-service
