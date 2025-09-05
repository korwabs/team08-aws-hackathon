#!/bin/bash

echo "🛑 Stopping MySQL Docker container..."

# Docker Compose로 MySQL 중지
docker compose down

echo "✅ MySQL container stopped!"
