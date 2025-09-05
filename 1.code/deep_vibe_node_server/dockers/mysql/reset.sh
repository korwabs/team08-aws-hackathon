#!/bin/bash

echo "MySQL 컨테이너 데이터 초기화 중..."

# 컨테이너 중지 및 제거
docker compose down

# 볼륨 제거 (데이터 완전 삭제)
docker volume rm mysql_data 2>/dev/null || true

# 컨테이너 재시작
docker compose up -d

echo "MySQL 데이터 초기화 완료!"
