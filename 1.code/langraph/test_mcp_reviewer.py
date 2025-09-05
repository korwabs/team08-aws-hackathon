#!/usr/bin/env python3
"""
MCP 서버 기반 Code Reviewer 에이전트 테스트
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# .env 파일 로드
load_dotenv(project_root / ".env")

def test_mcp_reviewer():
    """MCP 서버 기반 리뷰어 테스트"""
    print("🧪 MCP 서버 기반 Code Reviewer 에이전트 테스트")
    
    # 테스트용 HTML 코드 (의도적으로 문제가 있는 코드)
    test_html = """
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial; }
        .container { width: 100%; }
    </style>
</head>
<body>
    <div class="container">
        <h1>쇼핑몰</h1>
        <input type="text" placeholder="검색">
        <button>검색</button>
    </div>
    <script>
        var searchBtn = document.querySelector('button');
        searchBtn.onclick = function() {
            alert('검색 기능');
        }
    </script>
</body>
</html>
"""
    
    # 테스트용 PRD
    test_prd = """
# 쇼핑몰 요구사항
- 반응형 디자인 필수
- 검색 기능 구현
- 접근성 준수
- SEO 최적화
"""
    
    # 상태 설정
    test_state = {
        "html_code": test_html,
        "prd": test_prd,
        "messages": []
    }
    
    try:
        print("\n🔄 MCP 서버 기반 Code Reviewer 테스트:")
        from agents.code_reviewer.enhanced_agent import mcp_review_code
        
        mcp_result = mcp_review_code(test_state.copy())
        print(f"MCP 리뷰 길이: {len(mcp_result['reviewed_html'])} 문자")
        
        # 결과 저장
        output_dir = project_root / "outputs" / "mcp_reviews"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with open(output_dir / "mcp_review.md", 'w', encoding='utf-8') as f:
            f.write(mcp_result['reviewed_html'])
        
        print(f"\n✅ MCP 테스트 완료!")
        print(f"📁 결과 저장: {output_dir}")
        
        # 기존 리뷰어와 비교
        print("\n📊 기존 리뷰어와 비교:")
        from agents.code_reviewer.agent import review_code
        
        basic_result = review_code(test_state.copy())
        print(f"기본 리뷰 길이: {len(basic_result['reviewed_html'])} 문자")
        print(f"MCP 리뷰 길이: {len(mcp_result['reviewed_html'])} 문자")
        print(f"개선도: {len(mcp_result['reviewed_html']) - len(basic_result['reviewed_html'])} 문자 추가")
        
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("⚠️ 먼저 MCP 서버를 설치해주세요:")
    print("   ./setup_mcp_servers.sh")
    print()
    
    test_mcp_reviewer()
