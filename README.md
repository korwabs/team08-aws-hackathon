# Team 08 : DeepVibe - Voice-to-Demo Service

Amazon Q Developer Hackathon으로 구현한 실시간 음성 기반 프로토타입 생성 서비스입니다.

## 어플리케이션 개요

DeepVibe는 소규모 그룹 미팅에서 음성 대화와 시각적 목업을 실시간으로 인터랙티브한 HTML 데모로 변환하는 협업 미팅 어시스턴트입니다. 

회의 중 아이디어와 구현 사이의 커뮤니케이션 격차를 줄이고, 실시간 협업 디자인을 가능하게 하여 프로토타입 개발을 가속화합니다.

## 주요 기능

### 🎤 실시간 음성 처리
- 미팅 중 연속적인 음성 녹음
- 실시간 음성-텍스트 변환 (Amazon Transcribe)
- 미팅 컨텍스트 보존 및 분석

### 📸 시각적 입력 처리  
- 버튼 클릭을 통한 이미지 업로드
- 웹사이트 목업/와이어프레임 이미지 분석
- 시각적 요소 추출 및 해석

### 🚀 자동 데모 생성
- 음성 컨텍스트 + 업로드된 이미지로부터 자동 HTML 데모 생성
- 실시간 데모 렌더링 및 표시
- 인터랙티브 프로토타입 생성

### 🔄 반복적 개선
- 지속적인 음성 피드백 통합
- 진행 중인 대화를 기반으로 한 데모 개선
- 데모 반복 버전 추적

## 기술 스택

### Frontend
- **React 19** + **TypeScript** - 모던 웹 애플리케이션
- **Vite** - 빠른 개발 환경
- **Tailwind CSS** + **shadcn/ui** - 반응형 UI 컴포넌트
- **Socket.io Client** - 실시간 통신
- **Zustand** - 상태 관리

### AWS 서비스 통합
- **Amazon Transcribe** - 음성-텍스트 변환
- **Amazon Bedrock** - AI 기반 데모 생성 및 대화 분석
- **Amazon S3** - 이미지 저장 및 데모 호스팅
- **Amazon CloudFront** - 빠른 데모 전송
- **AWS ECS** - 컨테이너화된 애플리케이션 호스팅

## 동영상 데모


![Picture1](https://github.com/user-attachments/assets/a5093a81-87a0-42df-81fb-0eb0dfc25adb)


## 리소스 배포하기

### 로컬 개발 환경 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd team08-aws-hackathon

# 프론트엔드 의존성 설치 및 실행
cd 1.code/react-app
npm install
npm run dev
```

### AWS 배포 (예정)

AWS 인프라 배포를 위한 IaC 코드는 `2.iac` 디렉토리에 추가될 예정입니다.

**배포 예정 아키텍처:**
- Frontend: S3 + CloudFront
- Backend: ECS Fargate
- AI Services: Bedrock + Transcribe
- Storage: S3


## 프로젝트 기대 효과 및 예상 사용 사례

### 기대 효과
- **개발 속도 향상**: 아이디어에서 프로토타입까지의 시간 단축
- **커뮤니케이션 개선**: 시각적 프로토타입을 통한 명확한 의사소통
- **협업 효율성**: 실시간 피드백 반영으로 빠른 반복 개발
- **회의 생산성**: 미팅 중 즉시 구현 가능한 결과물 생성

### 예상 사용 사례
- **제품 디자인 미팅**: UX/UI 디자이너와 개발자 간 협업
- **클라이언트 프레젠테이션**: 실시간 요구사항 반영 및 시연
- **래피드 프로토타이핑 워크샵**: 빠른 아이디어 검증
- **이해관계자 피드백 세션**: 즉시 반영 가능한 시각적 피드백
- **디자인 리뷰 미팅**: 실시간 수정 및 개선사항 적용

---

*Amazon Q Developer Hackathon 2025 - Team 08*
