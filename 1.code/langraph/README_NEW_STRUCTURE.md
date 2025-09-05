# LangGraph 에이전트 시스템 - 공통 모델 아키텍처

## 🏗️ 아키텍처 개요

이 프로젝트는 AWS Bedrock Claude Opus 4.1 모델을 공통으로 사용하는 4개의 전문화된 에이전트로 구성된 LangGraph 워크플로우입니다.

### 핵심 설계 원칙

1. **단일 모델, 다중 프롬프트**: 하나의 AWS Bedrock 모델을 모든 에이전트가 공유
2. **중앙 집중식 설정**: 환경 변수 기반 모델 설정 관리
3. **모듈화된 구조**: 각 에이전트의 독립성 보장
4. **성능 모니터링**: 실행 시간 및 토큰 사용량 추적

## 📁 프로젝트 구조

```
langraph/
├── core/                          # 핵심 공통 모듈
│   ├── __init__.py
│   ├── model_factory.py          # 싱글톤 모델 팩토리
│   ├── base_agent.py             # 기본 에이전트 클래스
│   ├── prompts.py                # 에이전트별 프롬프트 템플릿
│   ├── config.py                 # 설정 관리자
│   └── utils.py                  # 공통 유틸리티
├── agents/                        # 에이전트 구현
│   ├── prd_generator/
│   ├── html_generator/
│   ├── code_reviewer/
│   └── html_tester/
├── main.py                       # 메인 워크플로우
├── example_usage.py              # 사용 예제
├── requirements.txt              # 의존성
├── .env                         # 환경 설정
└── .env.example                 # 환경 설정 템플릿
```

## 🔧 핵심 컴포넌트

### 1. ModelFactory (싱글톤 패턴)
```python
from core.model_factory import model_factory

# 모든 에이전트에서 동일한 모델 인스턴스 사용
model = model_factory.get_model()
```

### 2. BaseAgent (추상 클래스)
```python
from core.base_agent import BaseAgent

class CustomAgent(BaseAgent):
    def __init__(self):
        super().__init__("agent_type")
    
    def execute(self, state):
        return self.invoke_model(state, **prompt_kwargs)
```

### 3. PromptTemplates (중앙 집중식 프롬프트)
```python
from core.prompts import PromptTemplates

prompt = PromptTemplates.get_prompt("prd_generator", input_data="...")
```

## 🚀 사용 방법

### 1. 환경 설정
```bash
# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 AWS 자격증명 설정
```

### 2. 기본 실행
```python
from main import create_workflow

# 워크플로우 생성
workflow = create_workflow()

# 실행
result = workflow.invoke({
    "input_data": "웹 애플리케이션 요구사항",
    "prd": "",
    "html_code": "",
    "reviewed_html": "",
    "test_result": "",
    "messages": []
})
```

### 3. 예제 실행
```bash
python example_usage.py
```

## ⚙️ 설정 옵션

### 환경 변수
- `BEDROCK_MODEL_ID`: 사용할 Bedrock 모델 ID
- `AWS_REGION`: AWS 리전
- `MODEL_TEMPERATURE`: 모델 온도 설정 (기본값: 0)
- `MAX_TOKENS`: 최대 토큰 수
- `DEBUG`: 디버그 모드 활성화

### 모델 설정 변경
```python
from core.config import config_manager

# 현재 설정 확인
print(config_manager.get_model_kwargs())

# 디버그 모드 확인
if config_manager.is_debug_mode():
    print("디버그 모드 활성화됨")
```

## 🔄 워크플로우

1. **PRD Generator**: 입력 데이터 → Product Requirements Document
2. **HTML Generator**: PRD → 완전한 HTML5 코드
3. **Code Reviewer**: HTML 코드 → 검토 및 개선사항
4. **HTML Tester**: 검토된 HTML → 최종 테스트 결과

## 📊 성능 모니터링

```python
from core.utils import PerformanceMonitor

monitor = PerformanceMonitor().start()
# ... 작업 수행 ...
monitor.checkpoint("작업완료")
print(monitor.get_summary())
```

## 🛠️ 확장 방법

### 새로운 에이전트 추가
1. `agents/` 디렉토리에 새 폴더 생성
2. `BaseAgent`를 상속받는 클래스 구현
3. `PromptTemplates`에 프롬프트 추가
4. `main.py`에서 워크플로우에 연결

### 다른 모델 사용
1. `ModelFactory`에서 모델 타입 변경
2. 환경 변수에서 모델 설정 수정
3. 필요시 `requirements.txt`에 새 의존성 추가

## 🔍 디버깅

```bash
# 디버그 모드로 실행
DEBUG=true python main.py

# 상세 로그 확인
LOG_LEVEL=DEBUG python main.py
```

## 📈 장점

1. **코드 재사용성**: 공통 모델 팩토리로 중복 제거
2. **유지보수성**: 중앙 집중식 설정 관리
3. **확장성**: 새로운 에이전트 쉽게 추가 가능
4. **성능**: 싱글톤 패턴으로 모델 인스턴스 재사용
5. **모니터링**: 실행 시간 및 성능 추적

이 구조는 agent_rule.md의 모든 규칙을 준수하면서도 현대적인 소프트웨어 아키텍처 패턴을 적용한 확장 가능한 시스템입니다.
