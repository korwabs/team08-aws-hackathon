import os
import re
import json
from datetime import datetime
from typing import Optional, Dict, Any

class HTMLAgent:
    def __init__(self, llm_api_url: str = None):
        self.llm_api_url = llm_api_url or os.getenv('LLM_API_URL', 'https://d2co7xon1r3p3l.cloudfront.net/llm') or os.getenv('LLM_API_URL', 'http://langgraph-prd-alb-88774834.us-east-1.elb.amazonaws.com/llm')
        self.output_dir = "html_outputs"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_html(self, prd_file_path: str) -> str:
        """PRD 파일을 읽어서 HTML을 생성합니다."""
        prd_content = self._read_prd_file(prd_file_path)
        html_structure = self._extract_html_requirements(prd_content)
        html_content = self._generate_html_content(html_structure)
        
        # index.html로 저장
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
        title_match = re.search(r'# (.+)', prd_content)
        title = title_match.group(1) if title_match else "웹 애플리케이션"
        
        features = re.findall(r'- (.+)', prd_content)
        
        return {
            "title": title,
            "features": features[:5],
            "has_search": "검색" in prd_content or "조회" in prd_content,
            "has_data_generation": "생성" in prd_content or "동적" in prd_content,
        }
    
    def _generate_html_content(self, structure: Dict[str, Any]) -> str:
        """HTML 콘텐츠를 생성합니다."""
        return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{structure['title']}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .search-section {{ margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
        .data-display {{ margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; min-height: 200px; }}
        .feature-list {{ list-style-type: none; padding: 0; }}
        .feature-item {{ padding: 15px; margin: 5px 0; background: #e9e9e9; border-radius: 5px; cursor: pointer; transition: background 0.3s; }}
        .feature-item:hover {{ background: #d4edda; }}
        button {{ padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; }}
        button:hover {{ background: #0056b3; }}
        .loading {{ display: none; color: #666; font-style: italic; }}
        input[type="text"] {{ width: 300px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{structure['title']}</h1>
        
        {self._generate_search_section() if structure['has_search'] else ''}
        
        <div class="features-section">
            <h2>주요 기능</h2>
            <ul class="feature-list">
                {self._generate_feature_items(structure['features'])}
            </ul>
        </div>
        
        <div class="data-display" id="dataDisplay">
            <h3>동적 데이터</h3>
            <div id="dynamicContent">페이지를 로드하는 중입니다...</div>
        </div>
    </div>

    <script>
        {self._generate_javascript()}
    </script>
</body>
</html>"""
    
    def _generate_search_section(self) -> str:
        """검색 섹션을 생성합니다."""
        return """
        <div class="search-section">
            <h2>데이터 검색</h2>
            <input type="text" id="searchInput" placeholder="검색어를 입력하세요...">
            <button onclick="searchData()">검색</button>
            <div class="loading" id="loading">데이터를 생성중입니다...</div>
        </div>"""
    
    def _generate_feature_items(self, features: list) -> str:
        """기능 목록 아이템을 생성합니다."""
        items = []
        for i, feature in enumerate(features):
            items.append(f'<li class="feature-item" onclick="loadFeatureData({i}, \'{feature}\')">{feature}</li>')
        return '\n'.join(items)
    
    def _generate_javascript(self) -> str:
        """동적 데이터 생성을 위한 JavaScript를 생성합니다."""
        return f"""
        async function callLLM(prompt) {{
            try {{
                console.log('LLM API 호출 시작:', prompt);
                
                const response = await fetch('{self.llm_api_url}', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }},
                    body: JSON.stringify({{
                        prompt: prompt
                    }})
                }});
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {{
                    throw new Error(`HTTP error! status: ${{response.status}}`);
                }}
                
                const data = await response.json();
                console.log('Response data:', data);
                return data.response || '데이터를 생성할 수 없습니다.';
                
            }} catch (error) {{
                console.error('LLM API 호출 오류:', error);
                
                // 네트워크 오류시 로컬 더미 데이터 반환
                if (error.message.includes('Failed to fetch')) {{
                    return `
                    <div style="border: 2px solid #ff9800; padding: 15px; border-radius: 5px; background: #fff3e0;">
                        <h3>⚠️ 서버 연결 오류</h3>
                        <p>LLM API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.</p>
                        <p><strong>서버 시작:</strong> <code>python server.py start</code></p>
                        <hr>
                        <h4>테스트 데이터:</h4>
                        <table border="1" style="width:100%; border-collapse: collapse;">
                            <tr style="background-color: #f2f2f2;">
                                <th>항목</th><th>값</th><th>상태</th>
                            </tr>
                            <tr><td>상품 수</td><td>1,234개</td><td>정상</td></tr>
                            <tr><td>주문 수</td><td>567건</td><td>처리중</td></tr>
                            <tr><td>고객 수</td><td>890명</td><td>활성</td></tr>
                        </table>
                    </div>`;
                }}
                
                return `<div style="color: red;">오류가 발생했습니다: ${{error.message}}</div>`;
            }}
        }}

        async function searchData() {{
            const searchInput = document.getElementById('searchInput');
            const loading = document.getElementById('loading');
            const dataDisplay = document.getElementById('dynamicContent');
            
            const query = searchInput.value.trim();
            if (!query) {{
                alert('검색어를 입력해주세요.');
                return;
            }}
            
            loading.style.display = 'block';
            dataDisplay.innerHTML = '<div style="color: #666;">데이터를 생성중입니다...</div>';
            
            const prompt = `다음 검색어에 대한 상세한 정보를 HTML 형태로 생성해주세요: "${{query}}". 
            실제 데이터처럼 보이는 구체적인 내용을 포함하고, 표나 목록 형태로 구조화해주세요.`;
            
            const result = await callLLM(prompt);
            
            loading.style.display = 'none';
            dataDisplay.innerHTML = result;
        }}

        async function loadFeatureData(featureIndex, featureName) {{
            const dataDisplay = document.getElementById('dynamicContent');
            
            dataDisplay.innerHTML = '<div style="color: #666;">데이터를 생성중입니다...</div>';
            
            const prompt = `"${{featureName}}" 기능에 대한 상세 데이터를 HTML 표 형태로 생성해주세요. 
            실제 시스템에서 사용될 것 같은 구체적인 데이터를 포함해주세요. 
            예시 데이터, 통계, 차트 등을 포함하여 풍부한 내용으로 만들어주세요.`;
            
            const result = await callLLM(prompt);
            dataDisplay.innerHTML = result;
        }}

        // 페이지 로드시 초기 데이터 생성
        window.onload = async function() {{
            console.log('페이지 로드 완료, 초기 데이터 생성 시작');
            const prompt = "웹 애플리케이션의 대시보드에 표시될 초기 데이터를 HTML 형태로 생성해주세요. 차트, 통계, 최근 활동 등을 포함해주세요.";
            const result = await callLLM(prompt);
            document.getElementById('dynamicContent').innerHTML = result;
        }}
        """
