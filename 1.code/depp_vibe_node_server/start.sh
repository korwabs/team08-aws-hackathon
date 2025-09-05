#!/bin/bash

echo "🚀 Starting ECS service..."

# ECS 서비스 시작 (desired count를 1로 설정)
aws ecs update-service \
    --cluster chat-transcribe-cluster \
    --service chat-transcribe-service \
    --desired-count 1 \
    --region us-east-1

echo "✅ ECS service started (desired count set to 1)"
