import os
import re
import json
import boto3
from datetime import datetime
from typing import Optional, Dict, Any
from botocore.config import Config

class HTMLAgent:
    def __init__(self, llm_api_url: str = "http://localhost:8000/llm"):
        self.llm_api_url = llm_api_url
        self.output_dir = "html_outputs"
        self._setup_bedrock_client()
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _setup_bedrock_client(self):
        """Bedrock 클라이언트 설정"""
        config = Config(
            read_timeout=int(os.getenv("MODEL_TIMEOUT", "180")),
            connect_timeout=30,
            retries={'max_attempts': 3}
        )
        
        self.bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            config=config
        )
        
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-opus-4-1-20250805-v1:0")
    
    def generate_html(self, prd_file_path: str) -> str:
        """PRD 파일을 읽어서 HTML을 생성합니다."""
        prd_content = self._read_prd_file(prd_file_path)
        html_structure = self._extract_html_requirements(prd_content)
        html_content = self._generate_html_content(html_structure)
        
        output_file = f"{self.output_dir}/index.html"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return output_file
    
    def _read_prd_file(self, file_path: str) -> str:
        """PRD 파일을 읽습니다."""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _extract_html_requirements(self, prd_content: str) -> Dict[str, Any]:
        """PRD에서 HTML 요구사항을 추출합니다."""
        title = "웹 애플리케이션"
        project_name_match = re.search(r'### 1\.1 프로젝트 명\s*\n\*\*(.+?)\*\*', prd_content)
        if project_name_match:
            title = project_name_match.group(1).strip()
        else:
            patterns = [
                r'### 프로젝트명\s*\n(.+)',
                r'### 프로젝트 명\s*\n(.+)',
                r'# (.+)'
            ]
            for pattern in patterns:
                match = re.search(pattern, prd_content)
                if match:
                    title = match.group(1).strip()
                    break
        
        features = re.findall(r'- (.+)', prd_content)
        
        return {
            "title": title,
            "features": features,
            "prd_content": prd_content
        }
    
    def _generate_html_content(self, structure: Dict[str, Any]) -> str:
        """요약 내용을 분석하여 맞춤형 HTML을 생성합니다."""
        '<!DOCTYPE html>'
        design_prompt = f"""
        다음 PRD 내용을 깊이 분석하여 사용자 요구사항에 완벽히 맞는 웹 애플리케이션을 생성해주세요.

        프로젝트: {structure['title']}
        주요 기능: {', '.join(structure['features'])}
        
        PRD 전체 내용:
        {structure['prd_content']}
        
        **요구사항 분석 및 맞춤 설계:**
        1. **도메인 분석**: PRD 내용에서 비즈니스 도메인을 파악하고 해당 업종에 특화된 UI/UX 설계
           - 전자상거래: 상품 카탈로그, 장바구니, 주문 관리 중심
           - 의료/헬스케어: 환자 정보, 진료 기록, 안전한 데이터 표시
           - 교육: 학습자 중심, 진도 추적, 직관적 네비게이션
           - 금융: 보안 강조, 데이터 시각화, 거래 내역
           - 관리 시스템: 대시보드, 통계, 사용자 권한 관리
           - 기타: 프로젝트 특성에 맞는 독창적 접근

        2. **사용자 요구사항 반영**: 
           - 주요 기능들을 우선순위에 따라 배치
           - 사용자 워크플로우에 맞는 화면 구성
           - 필요한 데이터 입력/출력 인터페이스 설계

        3. **적합한 디자인 선택**:
           - 업종별 색상 팔레트 (신뢰감, 전문성, 친근함 등)
           - 적절한 레이아웃 (그리드, 카드, 테이블, 대시보드)
           - 타겟 사용자에 맞는 UI 복잡도 조절

        4. **현대적 웹 표준**:
           - 반응형 디자인 (모바일, 태블릿, 데스크톱)
           - 접근성 고려 (색상 대비, 키보드 네비게이션)
           - 성능 최적화 (CSS Grid/Flexbox)
           - 부드러운 인터랙션 (애니메이션, 트랜지션)

        **필수 JavaScript 기능 (정확히 구현):**
        ```javascript
        async function callLLM(prompt) {{
            try {{
                const response = await fetch('{self.llm_api_url}', {{
                    method: 'POST',
                    headers: {{ 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }},
                    body: JSON.stringify({{ prompt: prompt }})
                }});
                
                if (!response.ok) {{
                    throw new Error(`HTTP ${{response.status}}: ${{response.statusText}}`);
                }}
                
                const data = await response.json();
                return data.response || data.content || '데이터를 생성할 수 없습니다.';
            }} catch (error) {{
                console.error('LLM API 호출 오류:', error);
                return `<div style="color: red; padding: 10px; border: 1px solid red; border-radius: 5px;">오류: ${{error.message}}</div>`;
            }}
        }}

        async function searchData() {{
            const searchInput = document.getElementById('searchInput');
            const searchButton = document.getElementById('searchButton');
            
            if (!searchInput) return;
            
            const query = searchInput.value?.trim();
            if (!query) {{
                alert('검색어를 입력하세요.');
                return;
            }}
            
            const contentArea = document.getElementById('dynamicContent');
            if (!contentArea) return;
            
            // 버튼 비활성화 및 로딩 상태 표시
            if (searchButton) {{
                searchButton.disabled = true;
                searchButton.textContent = '검색 중...';
            }}
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">🔍 검색 중...</div>';
            
            const searchPrompt = `"{structure['title']}" 프로젝트의 "${{query}}" 검색 결과를 생성해주세요:

프로젝트 컨텍스트: {structure['title']}
주요 기능: {', '.join(structure['features'])}
검색어: "${{query}}"

요구사항:
- 프로젝트 도메인에 맞는 검색 결과 생성
- 검색어와 관련된 구체적이고 실용적인 정보
- HTML 테이블, 카드, 리스트 형태로 구조화
- 실제 데이터처럼 보이는 구체적인 수치와 내용
- 현대적인 인라인 CSS 스타일링
- 검색 결과 개수, 관련도, 날짜 등 메타 정보 포함

HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            try {{
                const result = await callLLM(searchPrompt);
                contentArea.innerHTML = result;
            }} catch (error) {{
                contentArea.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">검색 실패: ${{error.message}}</div>`;
            }} finally {{
                // 버튼 복원
                if (searchButton) {{
                    searchButton.disabled = false;
                    searchButton.textContent = '검색';
                }}
            }}
        }}

        // Enter 키로 검색 실행
        function setupSearchInput() {{
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {{
                searchInput.addEventListener('keypress', function(e) {{
                    if (e.key === 'Enter') {{
                        e.preventDefault();
                        searchData();
                    }}
                }});
            }}
        }}

        async function loadFeatureData(index, name) {{
            const contentArea = document.getElementById('dynamicContent');
            if (!contentArea) return;
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px;">⚙️ 데이터 로딩 중...</div>';
            
            const featurePrompt = `"${{name}}" 기능에 대한 전문적인 관리 화면을 HTML로 생성해주세요:

요구사항:
- ${{name}} 기능의 핵심 관리 요소들을 포함
- 실제 관리자 시스템에서 볼 수 있는 데이터 테이블
- 상태 표시기, 진행률, 통계 정보
- 액션 버튼들 (수정, 삭제, 추가 등)
- 필터링 및 정렬 옵션
- 현대적인 인라인 CSS 스타일링
- 실제 데이터처럼 보이는 구체적인 내용 (이름, 날짜, 수치 등)

HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(featurePrompt);
            contentArea.innerHTML = result;
        }}

        window.onload = async function() {{
            setupSearchInput(); // Enter 키 검색 설정
            
            const contentArea = document.getElementById('dynamicContent');
            if (!contentArea) return;
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px;">🚀 대시보드 로딩 중...</div>';
            
            const dashboardPrompt = `프로젝트 "{structure['title']}"에 적합한 관리자 대시보드 메인 화면을 HTML로 생성해주세요:

주요 기능들: {', '.join(structure['features'])}

요구사항:
- 프로젝트 특성에 맞는 KPI 카드들 (매출, 사용자 수, 성장률, 활동 지표 등)
- 실시간 통계 차트 (CSS로 구현된 간단한 바 차트나 도넛 차트)
- 최근 활동 피드 또는 알림 목록
- 빠른 액션 버튼들
- 중요 메트릭 요약
- 현대적이고 전문적인 인라인 CSS 스타일링
- 실제 대시보드처럼 보이는 구체적인 데이터와 수치

HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(dashboardPrompt);
            contentArea.innerHTML = result;
        }}
        ```

        **출력**: 완전한 HTML 문서 (<!DOCTYPE html>부터 </html>까지)

        PRD 내용을 바탕으로 실제 사용자가 원하는 기능과 디자인을 정확히 파악하여, 해당 도메인의 전문가가 설계한 수준의 웹 애플리케이션을 생성해주세요.

        코드 블록 마크다운(```html) 사용 금지
        </html>
        """
        
        try:
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": int(os.getenv("MAX_TOKENS", "8000")),
                    "temperature": float(os.getenv("MODEL_TEMPERATURE", "0")),
                    "messages": [
                        {
                            "role": "user",
                            "content": design_prompt
                        }
                    ]
                })
            )
            
            response_body = json.loads(response['body'].read())
            html_content = response_body['content'][0]['text']
            
            # HTML 문서 형식 확인
            if not html_content.strip().startswith('<!DOCTYPE html>'):
                html_content = f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{structure['title']}</title>
</head>
<body>
{html_content}
</body>
</html>"""
            
            return html_content
            
        except Exception as e:
            print(f"HTML 생성 오류: {e}")
            return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{structure['title']} - 오류</title>
</head>
<body>
    <h1>HTML 생성 오류</h1>
    <p>오류: {e}</p>
    <p>프로젝트: {structure['title']}</p>
    <script>
        async function callLLM(prompt) {{ return '오류 발생'; }}
        async function searchData() {{ }}
        async function loadFeatureData(index, name) {{ }}
        window.onload = function() {{ }}
    </script>
</body>
</html>"""
