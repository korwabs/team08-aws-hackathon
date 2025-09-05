#!/usr/bin/env python3
"""
LangChain Tools 기반 MCP 연동 테스트
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

def test_langchain_mcp_reviewer():
    """LangChain Tools 기반 MCP 리뷰어 테스트"""
    print("🧪 LangChain Tools 기반 MCP 연동 테스트")
    
    # 테스트용 HTML 코드
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
        print("\n🔧 LangChain Tools 기반 Code Reviewer 테스트:")
        from agents.code_reviewer.langchain_mcp_agent import langchain_mcp_review_code
        
        langchain_result = langchain_mcp_review_code(test_state.copy())
        print(f"LangChain Tools 리뷰 길이: {len(langchain_result['reviewed_html'])} 문자")
        
        # 결과 저장
        output_dir = project_root / "outputs" / "langchain_mcp_reviews"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        with open(output_dir / "langchain_mcp_review.md", 'w', encoding='utf-8') as f:
            f.write(langchain_result['reviewed_html'])
        
        print(f"\n✅ LangChain Tools 테스트 완료!")
        print(f"📁 결과 저장: {output_dir}")
        
        # 기존 리뷰어와 비교
        print("\n📊 다른 리뷰어들과 비교:")
        
        # 기본 리뷰어
        from agents.code_reviewer.agent import review_code
        basic_result = review_code(test_state.copy())
        print(f"기본 리뷰어: {len(basic_result['reviewed_html'])} 문자")
        
        # LangChain Tools 리뷰어
        print(f"LangChain Tools: {len(langchain_result['reviewed_html'])} 문자")
        
        # 개선도 계산
        improvement = len(langchain_result['reviewed_html']) - len(basic_result['reviewed_html'])
        print(f"개선도: {improvement} 문자 ({improvement/len(basic_result['reviewed_html'])*100:.1f}% 증가)")
        
        # 도구 사용 확인
        review_content = langchain_result['reviewed_html']
        if "LangChain Tools" in review_content:
            print("✅ LangChain Tools 정상 작동 확인")
        if "HTML 검증 도구" in review_content:
            print("✅ HTML 검증 도구 실행 확인")
        if "성능 분석 도구" in review_content:
            print("✅ 성능 분석 도구 실행 확인")
        if "JavaScript 품질 검사" in review_content:
            print("✅ JavaScript 품질 검사 도구 실행 확인")
        
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🎯 LangChain Tools를 사용한 MCP 서버 연동 방식 테스트")
    print("📋 mcp_config.json 설정 파일 기반으로 동작합니다.")
    print()
    
    test_langchain_mcp_reviewer()
