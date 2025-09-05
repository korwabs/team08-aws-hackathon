# 실시간 채팅 & AWS Transcribe 프로젝트

## 프로젝트 개요
WebSocket 기반 실시간 채팅과 AWS Transcribe 음성인식 기능을 제공하는 Node.js 애플리케이션

### 핵심 기능
- **실시간 채팅**: WebSocket을 통한 즉시 메시지 송수신
- **음성인식**: AWS Transcribe를 활용한 실시간 음성-텍스트 변환
- **채팅방 관리**: 다중 채팅방 생성 및 관리
- **메시지 저장**: MySQL 데이터베이스를 통한 채팅 이력 관리
- **API 문서화**: Swagger UI를 통한 REST API 문서 제공

### 기술 스택
- **Backend**: Node.js, Express, Socket.IO, TypeScript
- **Database**: AWS RDS MySQL (UTF-8 지원)
- **AWS Services**: Transcribe, ECS, ECR, ALB
- **Infrastructure**: Terraform (IaC)
- **Container**: Docker
- **Documentation**: Swagger/OpenAPI

## 프로젝트 구조

```
├── src/
│   ├── server.ts              # 메인 서버 (Express + Socket.IO)
│   ├── database.ts            # MySQL 연결 및 테이블 초기화
│   ├── transcribe-service.ts  # AWS Transcribe 서비스 로직
│   ├── swagger.ts             # API 문서 설정
│   └── types.ts               # TypeScript 타입 정의
├── package.json               # 의존성 관리
├── tsconfig.json              # TypeScript 설정
├── Dockerfile                 # 컨테이너 이미지 빌드
├── deploy.sh                  # 자동 배포 스크립트
├── .env.example               # 환경 변수 템플릿
│
├── public/                    # 프론트엔드 (데모 웹페이지)
│   ├── index.html             # 메인 UI
│   └── app.js                 # 클라이언트 JavaScript
│
├── terraform/                 # AWS 인프라 구성
│   ├── main.tf                # 메인 리소스 정의 (UTF-8 지원)
│   ├── variables.tf           # 변수 정의
│   └── outputs.tf             # 출력값 정의
│
├── HISTORY.md                 # 개발 이력 관리
└── AMAZON_Q.md                # 프로젝트 문서
```

## 아키텍처 흐름

### 음성인식 흐름
```
Frontend → WebSocket → Backend → AWS Transcribe → MySQL
```

### 채팅 흐름
```
Client → Socket.IO → Server → MySQL → All Clients
```

## 주요 컴포넌트

### 1. 서버 (server.ts)
- Express 웹 서버
- Socket.IO WebSocket 관리
- REST API 엔드포인트 (Swagger 문서화)
- 채팅방 및 메시지 처리

### 2. 데이터베이스 (database.ts)
- MySQL 연결 풀 관리
- 테이블 자동 생성
- 채팅방/메시지 스키마

### 3. 음성인식 (transcribe-service.ts)
- AWS Transcribe SDK 연동
- 실시간 오디오 스트림 처리
- VAD(Voice Activity Detection) 설정
- 음성-텍스트 변환 결과 관리

### 4. 인프라 (terraform/)
- ECS Fargate 클러스터
- RDS MySQL 인스턴스 (UTF-8 지원)
- Application Load Balancer
- VPC 및 보안 그룹

## 최근 개선사항 (2025-09-05)

### 1. TypeScript 마이그레이션
- JavaScript → TypeScript 전환
- 타입 안정성 확보
- `npm run type-check` 명령어 추가

### 2. AWS Transcribe 최적화
- 올바른 스트림 패턴 구현 (Readable 스트림 사용)
- AbortController를 통한 안전한 리소스 정리
- VAD 설정 추가 (PartialResultsStability: 'medium')
- 불필요한 로그 제거 (메시지 저장 시에만 로그 출력)

### 3. 데이터베이스 한글 지원
- MySQL UTF-8 (utf8mb4) 설정 추가
- 한글 채팅 메시지 및 음성인식 결과 완전 지원

### 4. API 문서화
- Swagger UI 추가 (`/api-docs`)
- REST API 엔드포인트 문서화
- WebSocket 이벤트 문서화

### 5. 개발 환경 개선
- TypeScript 컴파일 및 타입 체크
- 개발 서버 자동 재시작
- 코드 품질 향상

## API 엔드포인트

### REST API
- `GET /api/rooms` - 채팅방 목록 조회
- `POST /api/rooms` - 채팅방 생성
- `GET /api/rooms/{roomId}/messages` - 채팅 메시지 조회
- `GET /api-docs` - Swagger UI

### WebSocket 이벤트
- `join-room` - 채팅방 입장
- `chat-message` - 채팅 메시지 전송
- `start-transcribe` - 음성인식 시작
- `audio-data` - 오디오 데이터 전송
- `stop-transcribe` - 음성인식 중지
- `set-user` - 사용자 ID 설정

## 배포 환경
- **개발**: 로컬 환경 (localhost:3000)
- **운영**: AWS ECS + RDS + ALB

## 개발 명령어
```bash
npm run dev        # 개발 서버 실행
npm run build      # TypeScript 빌드
npm run type-check # 타입 검증
npm start          # 프로덕션 서버 실행
```
