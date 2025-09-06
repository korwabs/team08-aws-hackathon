#!/usr/bin/env python3
from prd_agent import PRDAgent
from html_agent import HTMLAgent
import os

class Workflow:
    def __init__(self, llm_api_url: str = "http://localhost:8000/llm"):
        self.prd_agent = PRDAgent()
        self.html_agent = HTMLAgent(llm_api_url)
    
    def run_complete_workflow(self, conversation_summary: str, prd_url: str = None, 
                            image_url: str = None, html_url: str = None):
        """PRD 생성 → HTML 생성 전체 워크플로우 실행"""
        
        print("🚀 워크플로우 시작...")
        
        # 1. PRD 생성
        print("📝 1단계: PRD 생성 중...")
        prd_file = self.prd_agent.generate_prd(
            conversation_summary=conversation_summary,
            prd_url=prd_url,
            image_url=image_url,
            html_url=html_url
        )
        print(f"✅ PRD 생성 완료: {prd_file}")
        
        # 2. HTML 생성
        print("🌐 2단계: HTML 생성 중...")
        html_file = self.html_agent.generate_html(prd_file)
        print(f"✅ HTML 생성 완료: {html_file}")
        
        print("🎉 워크플로우 완료!")
        
        return {
            "prd_file": prd_file,
            "html_file": html_file,
            "success": True,
            "message": "PRD와 HTML이 성공적으로 생성되었습니다."
        }

def main():
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python workflow.py <conversation_summary> [prd_url] [image_url] [html_url]")
        print("  python workflow.py --json <json_file>")
        sys.exit(1)
    
    workflow = Workflow()
    
    # JSON 파일로 입력받는 경우
    if sys.argv[1] == "--json":
        if len(sys.argv) < 3:
            print("JSON 파일 경로를 제공해주세요.")
            sys.exit(1)
        
        with open(sys.argv[2], 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        result = workflow.run_complete_workflow(
            conversation_summary=data.get('conversation_summary', ''),
            prd_url=data.get('prd_url'),
            image_url=data.get('image_url'),
            html_url=data.get('html_url')
        )
    else:
        # 명령행 인자로 입력받는 경우
        conversation_summary = sys.argv[1]
        prd_url = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'None' else None
        image_url = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'None' else None
        html_url = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != 'None' else None
        
        result = workflow.run_complete_workflow(
            conversation_summary=conversation_summary,
            prd_url=prd_url,
            image_url=image_url,
            html_url=html_url
        )
    
    print(f"\n📍 생성된 파일들:")
    print(f"   PRD: {result['prd_file']}")
    print(f"   HTML: {result['html_file']}")
    print(f"   브라우저: http://localhost:8000/html/index.html")

if __name__ == "__main__":
    main()
