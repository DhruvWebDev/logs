# This script sets up a promethheus and backend
docker compose up -d

# This script sets up a grafana 
docker run -d -p 9090:3000 --name=grafana grafana/grafana-oss

# This script sets up a loki
docker run -d --name=loki -p 3100:3100 grafana/loki
