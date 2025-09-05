# 실시간 채팅 & AWS Transcribe 프로젝트 - 진행 상황

## 🎯 프로젝트 개요
WebSocket 기반 실시간 채팅과 AWS Transcribe를 활용한 음성인식 기능을 제공하는 Node.js 애플리케이션

## ✅ 완료된 작업

### 1. 인프라 구축 (Terraform)
- **VPC**: 10.0.0.0/16 CIDR 블록
- **서브넷**: Public/Private 서브넷 (us-east-1a, us-east-1b)
- **보안 그룹**: ALB(80,443), ECS(3000), RDS(3306) 포트 설정
- **인터넷 게이트웨이**: 퍼블릭 인터넷 연결

### 2. 컨테이너화 & 배포
- **Docker**: Node.js 18-alpine 기반 이미지
- **ECR**: 975050072930.dkr.ecr.us-east-1.amazonaws.com/chat-transcribe-app
- **ECS Fargate**: 서버리스 컨테이너 실행
- **플랫폼 호환성**: linux/amd64 아키텍처로 빌드

### 3. 데이터베이스
- **RDS MySQL 8.0**: chat-transcribe-mysql.ciz2q440a5xa.us-east-1.rds.amazonaws.com
- **데이터베이스**: chatapp
- **테이블**: chat_rooms, messages
- **연결 문제 해결**: 호스트명에서 포트 분리 처리

### 4. 로드 밸런싱 & HTTPS
- **ALB**: chat-transcribe-alb-1261670094.us-east-1.elb.amazonaws.com
- **CloudFront**: d2k05d66hwbq2e.cloudfront.net
- **HTTPS**: CloudFront를 통한 SSL/TLS 암호화
- **자동 리다이렉트**: HTTP → HTTPS

### 5. 애플리케이션 기능
- **실시간 채팅**: Socket.IO 기반 WebSocket 통신
- **음성인식**: AWS Transcribe 실시간 스트리밍
- **채팅방 관리**: 생성, 입장, 메시지 저장
- **웹 인터페이스**: 데모 페이지 제공

## 🏗️ 현재 아키텍처

```
┌─────────────────┐    HTTPS    ┌──────────────────┐
│   사용자 브라우저   │ ──────────► │   CloudFront     │
│                 │             │ (SSL 인증서)      │
└─────────────────┘             └──────────────────┘
                                          │ HTTP
                                          ▼
                                ┌──────────────────┐
                                │ Application LB   │
                                │ (ALB)           │
                                └──────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                   │
│                                                         │
│  ┌─────────────────┐              ┌─────────────────┐   │
│  │  Public Subnet  │              │  Public Subnet  │   │
│  │   us-east-1a    │              │   us-east-1b    │   │
│  │                 │              │                 │   │
│  │  ┌───────────┐  │              │  ┌───────────┐  │   │
│  │  │ECS Fargate│  │              │  │ECS Fargate│  │   │
│  │  │   Task    │  │              │  │   Task    │  │   │
│  │  │(Node.js)  │  │              │  │(Node.js)  │  │   │
│  │  └───────────┘  │              │  └───────────┘  │   │
│  └─────────────────┘              └─────────────────┘   │
│                                                         │
│  ┌─────────────────┐              ┌─────────────────┐   │
│  │ Private Subnet  │              │ Private Subnet  │   │
│  │   us-east-1a    │              │   us-east-1b    │   │
│  │                 │              │                 │   │
│  │  ┌───────────┐  │              │  ┌───────────┐  │   │
│  │  │    RDS    │  │              │  │    RDS    │  │   │
│  │  │   MySQL   │  │              │  │  (Standby) │  │   │
│  │  └───────────┘  │              │  └───────────┘  │   │
│  └─────────────────┘              └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ AWS Transcribe   │
                                │ (음성인식 서비스)  │
                                └──────────────────┘
```

## 🔧 기술 스택

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **WebSocket**: Socket.IO
- **Database**: MySQL2 (Promise 기반)
- **Language**: TypeScript

### Infrastructure
- **Container**: Docker + ECS Fargate
- **Database**: RDS MySQL 8.0
- **Load Balancer**: Application Load Balancer
- **CDN**: CloudFront
- **IaC**: Terraform

### AWS Services
- **ECS**: 컨테이너 오케스트레이션
- **ECR**: 컨테이너 이미지 저장소
- **RDS**: 관리형 데이터베이스
- **VPC**: 네트워크 격리
- **CloudFront**: 글로벌 CDN + HTTPS
- **Transcribe**: 실시간 음성인식
- **CloudWatch**: 로그 및 모니터링

## 🌐 접속 정보

### 프로덕션 URL
- **HTTPS**: https://d2k05d66hwbq2e.cloudfront.net
- **HTTP (리다이렉트)**: http://chat-transcribe-alb-1261670094.us-east-1.elb.amazonaws.com

### API 엔드포인트
- `GET /api/rooms` - 채팅방 목록
- `POST /api/rooms` - 채팅방 생성
- `GET /api/rooms/:roomId/messages` - 메시지 조회

### WebSocket 이벤트
- `join-room` - 채팅방 입장
- `chat-message` - 메시지 전송
- `start-transcribe` - 음성인식 시작
- `audio-data` - 오디오 스트림
- `stop-transcribe` - 음성인식 중지

## 🚀 배포 스크립트

### 자동 배포
```bash
./deploy.sh    # 전체 인프라 + 애플리케이션 배포
```

### 서비스 관리
```bash
./start.sh     # ECS 서비스 시작
./stop.sh      # ECS 서비스 중지
./destroy.sh   # 전체 인프라 삭제
```

## 🔍 해결된 주요 이슈

### 1. Docker 아키텍처 호환성
- **문제**: Apple Silicon(ARM64) → x86_64 ECS 실행 오류
- **해결**: `--platform linux/amd64` 플래그로 빌드

### 2. 데이터베이스 연결
- **문제**: RDS 엔드포인트에 포트 포함으로 DNS 해석 실패
- **해결**: 호스트명에서 포트 분리 (`split(':')[0]`)

### 3. HTTPS 요구사항
- **문제**: 마이크 권한을 위한 HTTPS 필요
- **해결**: CloudFront 배포로 SSL/TLS 제공

## 📊 현재 상태

### ✅ 정상 작동 기능
- 실시간 채팅 (WebSocket)
- 데이터베이스 연동 (MySQL)
- HTTPS 보안 연결
- 마이크 권한 허용
- AWS Transcribe 음성인식
- 자동 스케일링 (ECS Fargate)

### 🎯 테스트 가능한 시나리오
1. **채팅방 생성**: 새로운 채팅방 만들기
2. **실시간 메시지**: 여러 사용자 간 실시간 채팅
3. **음성인식**: 마이크로 음성 입력 → 텍스트 변환
4. **메시지 저장**: 데이터베이스에 채팅 기록 저장
5. **세션 관리**: 사용자 입장/퇴장 처리

## 💰 예상 비용 (월간)
- **ECS Fargate**: ~$15-30 (vCPU 0.25, 메모리 0.5GB)
- **RDS MySQL**: ~$15-25 (db.t3.micro)
- **CloudFront**: ~$1-5 (트래픽 기반)
- **기타 (VPC, ALB 등)**: ~$5-10
- **총 예상**: ~$36-70/월

## 🔄 다음 단계 (선택사항)
1. **도메인 연결**: Route 53 + ACM 인증서
2. **모니터링**: CloudWatch 대시보드
3. **CI/CD**: GitHub Actions 파이프라인
4. **보안 강화**: WAF, 보안 그룹 최적화
5. **성능 최적화**: 캐싱, DB 인덱싱
