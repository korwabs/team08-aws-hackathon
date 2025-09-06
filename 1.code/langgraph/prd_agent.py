from typing import Dict, Optional, Any
from datetime import datetime
import os
import json
import boto3
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

class PRDAgent:
    def __init__(self):
        self.output_dir = "prd_outputs"
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Bedrock 클라이언트 초기화
        self.bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        self.model_id = os.getenv('BEDROCK_MODEL_ID', 'us.anthropic.claude-opus-4-1-20250805-v1:0')
    
    def generate_prd(self, 
                    conversation_summary: str,
                    prd_url: Optional[str] = None,
                    image_url: Optional[str] = None,
                    html_url: Optional[str] = None) -> str:
        """PRD 생성 메인 함수"""
        
        print(f"PRD 생성 시작: {conversation_summary[:50]}...")
        
        # 시나리오 결정
        scenario = self._determine_scenario(prd_url, image_url, html_url)
        print(f"시나리오: {scenario}")
        
        # Bedrock API로 PRD 생성
        try:
            prd_content = self._generate_prd_with_bedrock(conversation_summary, scenario, image_url, html_url)
            print("✅ Bedrock API로 PRD 생성 완료")
        except Exception as e:
            print(f"❌ Bedrock API 오류: {e}")
            prd_content = self._create_fallback_prd(conversation_summary, scenario)
            print("✅ 폴백 PRD 생성 완료")
        
        # 파일 저장
        filename = "prd.md"
        filepath = os.path.join(self.output_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(prd_content)
        
        print(f"✅ PRD 파일 저장: {filepath}")
        return filepath
    
    def _determine_scenario(self, prd_url: Optional[str], image_url: Optional[str], 
                           html_url: Optional[str]) -> str:
        """시나리오 결정"""
        if image_url and html_url:
            return "modify_html_with_image_style"
        elif html_url:
            return "modify_existing_html"
        elif image_url:
            return "create_html_from_image"
        else:
            return "create_new_html"
    
    def _generate_prd_with_bedrock(self, conversation_summary: str, scenario: str, 
                                  image_url: Optional[str], html_url: Optional[str]) -> str:
        """Bedrock API를 사용하여 PRD 생성"""
        
        # 간단한 프롬프트 구성
        prompt = f"""당신은 PRD(Product Requirements Document) 생성 전문 에이전트입니다.

다음 정보를 바탕으로 완전한 PRD를 생성해주세요:

**요구사항:** {conversation_summary}
**시나리오:** {scenario}
**이미지 URL:** {image_url or 'None'}
**HTML URL:** {html_url or 'None'}

다음 구조로 PRD를 작성해주세요:

# Product Requirements Document (PRD)

## 프로젝트 개요
## 요구사항 분석
## 기술적 구현 사항
## HTML 에이전트 실행 가이드
## 데이터 처리 요구사항
## 품질 보증 체크리스트

각 섹션에는 구체적이고 실행 가능한 내용을 포함해주세요.
특히 동적 데이터 생성을 위한 LLM API 호출 코드를 JavaScript로 포함해주세요."""

        # Bedrock API 호출
        response = self.bedrock_client.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "temperature": 0,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        # 응답 파싱
        response_body = json.loads(response['body'].read())
        prd_content = response_body['content'][0]['text']
        
        return prd_content
    
    def _create_fallback_prd(self, conversation_summary: str, scenario: str) -> str:
        """Bedrock API 실패 시 폴백 PRD 생성"""
        return f"""# Product Requirements Document (PRD)

## 프로젝트 개요
**생성일시:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**시나리오:** {scenario}
**상태:** 폴백 모드 (Bedrock API 연동 실패)

## 요구사항 분석
### 핵심 요구사항
{conversation_summary}

## 기술적 구현 사항
### 동적 데이터 생성 API
```javascript
async function generateContextualData(elementType, context) {{
    const response = await fetch('/api/llm/generate-data', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{elementType, context}})
    }});
    return await response.json();
}}
```

## HTML 에이전트 실행 가이드
1. 요구사항 분석
2. HTML 구조 설계
3. CSS 스타일링
4. JavaScript 기능 구현
5. 테스트 및 배포

## 데이터 처리 요구사항
- 동적 콘텐츠 생성
- 사용자 인터랙션 처리
- 데이터 검증 및 저장

## 품질 보증 체크리스트
- [ ] 기능 요구사항 충족
- [ ] 반응형 디자인 적용
- [ ] 접근성 가이드라인 준수
- [ ] 성능 최적화 완료
"""

# 테스트 실행
if __name__ == "__main__":
    agent = PRDAgent()
    prd_file = agent.generate_prd("테스트용 간단한 블로그 플랫폼 개발")
    print(f"PRD 파일 생성 완료: {prd_file}")
