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
        
        # CSS 스타일 가이드 감지
        css_guide = ""
        has_image_css = False
        
        # 이미지 기반 스타일 가이드 섹션 찾기
        css_patterns = [
            r'## 이미지 기반 스타일 가이드\s*\n(.*?)(?=\n##|\n#|$)',
            r'### 4\.2 이미지 기반 스타일 가이드\s*\n(.*?)(?=\n##|\n#|$)',
            r'\*\*중요: HTML 생성 시 아래 CSS 정보만 사용하고 다른 CSS는 생성하지 마세요\.\*\*\s*\n(.*?)(?=\n##|\n#|$)'
        ]
        
        for pattern in css_patterns:
            match = re.search(pattern, prd_content, re.DOTALL)
            if match:
                css_guide = match.group(1).strip()
                has_image_css = True
                print("✅ PRD에서 이미지 기반 CSS 가이드 발견")
                break
        
        return {
            "title": title,
            "features": features,
            "prd_content": prd_content,
            "css_guide": css_guide,
            "has_image_css": has_image_css
        }
    
    def _generate_html_content(self, structure: Dict[str, Any]) -> str:
        """요약 내용을 분석하여 맞춤형 HTML을 생성합니다."""
        
        # 이미지 기반 CSS가 있는 경우와 없는 경우 구분
        if structure.get('has_image_css'):
            return self._generate_html_with_predefined_css(structure)
        else:
            return self._generate_html_with_auto_css(structure)
    
    def _generate_html_with_predefined_css(self, structure: Dict[str, Any]) -> str:
        """PRD의 이미지 기반 CSS를 사용하여 HTML을 생성합니다."""
        print("🎨 이미지 기반 CSS로 HTML 생성")
        
        design_prompt = f"""
        다음 PRD 내용과 이미지 기반 CSS 가이드를 사용하여 웹 애플리케이션을 생성해주세요.

        프로젝트: {structure['title']}
        주요 기능: {', '.join(structure['features'])}
        
        **중요 지시사항:**
        1. 아래 CSS 가이드만 사용하고 다른 CSS 스타일은 절대 생성하지 마세요
        2. 색상, 레이아웃, 컴포넌트 스타일을 정확히 따라주세요
        3. 자체적인 CSS 디자인은 추가하지 마세요
        
        **이미지 기반 CSS 가이드:**
        {structure['css_guide']}
        
        **필수 JavaScript 기능:**
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
            
            if (searchButton) {{
                searchButton.disabled = true;
                searchButton.textContent = '검색 중...';
            }}
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">🔍 검색 중...</div>';
            
            const searchPrompt = `"{structure['title']}" 프로젝트의 "${{query}}" 검색 결과를 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            try {{
                const result = await callLLM(searchPrompt);
                contentArea.innerHTML = result;
            }} catch (error) {{
                contentArea.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">검색 실패: ${{error.message}}</div>`;
            }} finally {{
                if (searchButton) {{
                    searchButton.disabled = false;
                    searchButton.textContent = '검색';
                }}
            }}
        }}

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
            
            const featurePrompt = `"${{name}}" 기능에 대한 관리 화면을 HTML로 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(featurePrompt);
            contentArea.innerHTML = result;
        }}

        window.onload = async function() {{
            setupSearchInput();
            
            const contentArea = document.getElementById('dynamicContent');
            if (!contentArea) return;
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px;">🚀 대시보드 로딩 중...</div>';
            
            const dashboardPrompt = `프로젝트 "{structure['title']}"에 적합한 대시보드를 HTML로 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(dashboardPrompt);
            contentArea.innerHTML = result;
        }}
        ```

        **출력**: 완전한 HTML 문서 (<!DOCTYPE html>부터 </html>까지)
        
        위의 CSS 가이드를 정확히 따라 구현하고, 다른 CSS 스타일은 추가하지 마세요.
        """
        
        return self._call_bedrock_for_html(design_prompt, structure)
    
    def _generate_html_with_auto_css(self, structure: Dict[str, Any]) -> str:
        """자동 CSS 생성으로 HTML을 생성합니다."""
        print("🎨 자동 CSS로 HTML 생성")
    def _generate_html_with_auto_css(self, structure: Dict[str, Any]) -> str:
        """자동 CSS 생성으로 HTML을 생성합니다."""
        print("🎨 자동 CSS로 HTML 생성")
        
        design_prompt = f"""
        다음 PRD 내용을 깊이 분석하여 사용자 요구사항에 완벽히 맞는 웹 애플리케이션을 생성해주세요.

        프로젝트: {structure['title']}
        주요 기능: {', '.join(structure['features'])}
        
        PRD 전체 내용:
        {structure['prd_content']}
        
        **요구사항 분석 및 맞춤 설계:**
        1. **도메인 분석**: PRD 내용에서 비즈니스 도메인을 파악하고 해당 업종에 특화된 UI/UX 설계
        2. **사용자 요구사항 반영**: 주요 기능들을 우선순위에 따라 배치
        3. **적합한 디자인 선택**: 업종별 색상 팔레트, 적절한 레이아웃
        4. **현대적 웹 표준**: 반응형 디자인, 접근성 고려

        **필수 JavaScript 기능:**
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
            
            if (searchButton) {{
                searchButton.disabled = true;
                searchButton.textContent = '검색 중...';
            }}
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">🔍 검색 중...</div>';
            
            const searchPrompt = `"{structure['title']}" 프로젝트의 "${{query}}" 검색 결과를 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            try {{
                const result = await callLLM(searchPrompt);
                contentArea.innerHTML = result;
            }} catch (error) {{
                contentArea.innerHTML = `<div style="color: red; padding: 20px; text-align: center;">검색 실패: ${{error.message}}</div>`;
            }} finally {{
                if (searchButton) {{
                    searchButton.disabled = false;
                    searchButton.textContent = '검색';
                }}
            }}
        }}

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
            
            const featurePrompt = `"${{name}}" 기능에 대한 관리 화면을 HTML로 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(featurePrompt);
            contentArea.innerHTML = result;
        }}

        window.onload = async function() {{
            setupSearchInput();
            
            const contentArea = document.getElementById('dynamicContent');
            if (!contentArea) return;
            
            contentArea.innerHTML = '<div style="text-align: center; padding: 20px;">🚀 대시보드 로딩 중...</div>';
            
            const dashboardPrompt = `프로젝트 "{structure['title']}"에 적합한 대시보드를 HTML로 생성해주세요. HTML만 반환하고 추가 설명은 제외해주세요.`;
            
            const result = await callLLM(dashboardPrompt);
            contentArea.innerHTML = result;
        }}
        ```

        **출력**: 완전한 HTML 문서 (<!DOCTYPE html>부터 </html>까지)
        """
        
        return self._call_bedrock_for_html(design_prompt, structure)
    
    def _call_bedrock_for_html(self, prompt: str, structure: Dict[str, Any]) -> str:
        """Bedrock API를 호출하여 HTML을 생성합니다."""
        try:
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 8000,
                    "temperature": float(os.getenv("MODEL_TEMPERATURE", "0")),
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
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
