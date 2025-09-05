# 실시간 채팅 & AWS Transcribe 프로젝트

WebSocket 기반 실시간 채팅과 AWS Transcribe를 활용한 음성인식 기능을 제공하는 Node.js 애플리케이션입니다.

## 주요 기능

1. **AWS Transcribe 실시간 음성인식**
   - Frontend → WebSocket → Backend → AWS Transcribe 연동
   - 실시간 음성 전사 및 채팅 메시지 자동 저장

2. **채팅 세션 관리**
   - WebSocket 기반 실시간 채팅
   - SQLite 데이터베이스를 통한 채팅방 및 메시지 관리

3. **데모 웹페이지**
   - 채팅방 생성/입장 기능
   - 실시간 메시지 송수신
   - 음성인식 시작/중지 제어

## 기술 스택

- **Backend**: Node.js, Express, Socket.IO
- **Database**: SQLite
- **AWS Services**: Transcribe, ECS, ECR, ALB
- **Infrastructure**: Terraform
- **Container**: Docker

## 로컬 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에서 AWS 자격 증명 설정
```

### 3. 애플리케이션 실행
```bash
npm run dev
```

### 4. 웹 브라우저에서 접속
```
http://localhost:3000
```

## AWS 배포

### 사전 요구사항
- AWS CLI 설치 및 구성
- Terraform 설치
- Docker 설치

### 배포 실행
```bash
./deploy.sh
```

배포 스크립트는 다음 작업을 수행합니다:
1. Terraform으로 AWS 인프라 생성
2. Docker 이미지 빌드 및 ECR 푸시
3. ECS 서비스 배포

## 프로젝트 구조

```
├── server.js              # 메인 서버 파일
├── database.js            # SQLite 데이터베이스 설정
├── transcribe-service.js  # AWS Transcribe 서비스
├── public/                # 정적 파일 (데모 웹페이지)
│   ├── index.html
│   └── app.js
├── terraform/             # IaC 구성
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── Dockerfile
├── deploy.sh
└── README.md
```

## API 엔드포인트

### REST API
- `GET /api/rooms` - 채팅방 목록 조회
- `POST /api/rooms` - 채팅방 생성
- `GET /api/rooms/:roomId/messages` - 채팅 메시지 조회

### WebSocket 이벤트
- `join-room` - 채팅방 입장
- `chat-message` - 채팅 메시지 전송
- `start-transcribe` - 음성인식 시작
- `audio-data` - 오디오 데이터 전송
- `stop-transcribe` - 음성인식 중지

## 사용 방법

1. **채팅방 생성**: 웹페이지에서 채팅방 이름 입력 후 생성
2. **채팅방 입장**: 드롭다운에서 채팅방 선택 후 입장
3. **사용자 설정**: 사용자 ID 입력
4. **텍스트 채팅**: 메시지 입력창에서 채팅
5. **음성인식**: 마이크 버튼 클릭하여 음성인식 시작/중지

## 주의사항

- 음성인식 기능 사용 시 마이크 권한 필요
- AWS 자격 증명이 올바르게 설정되어야 함
- 실제 운영 환경에서는 보안 그룹 및 네트워크 설정 검토 필요
