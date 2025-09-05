#!/bin/bash

echo "🐳 Starting MySQL Docker container..."

# Docker Compose로 MySQL 실행
docker compose up -d

echo "⏳ Waiting for MySQL to be ready..."
sleep 10

echo "✅ MySQL is ready!"
echo "📊 Connection info:"
echo "  Host: localhost"
echo "  Port: 3306"
echo "  Database: chatapp"
echo "  User: root (password: ChatApp123!)"
echo "  User: chatuser (password: ChatApp123!)"

echo ""
echo "🔗 To connect:"
echo "  mysql -h localhost -P 3306 -u root -p"
echo ""
echo "🛑 To stop:"
echo "  docker compose down"
