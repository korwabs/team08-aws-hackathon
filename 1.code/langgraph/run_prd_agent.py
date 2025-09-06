#!/usr/bin/env python3
"""
PRD 에이전트 실행 스크립트
"""

import sys
import json
from prd_agent import PRDAgent

def main():
    if len(sys.argv) < 2:
        print("사용법: python run_prd_agent.py <conversation_summary> [prd_url] [image_url] [html_url]")
        print("또는: python run_prd_agent.py --json <json_file>")
        sys.exit(1)
    
    agent = PRDAgent()
    
    # JSON 파일로 입력받는 경우
    if sys.argv[1] == "--json":
        if len(sys.argv) < 3:
            print("JSON 파일 경로를 제공해주세요.")
            sys.exit(1)
        
        try:
            with open(sys.argv[2], 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            prd_file = agent.generate_prd(
                conversation_summary=data.get('conversation_summary', ''),
                prd_url=data.get('prd_url'),
                image_url=data.get('image_url'),
                html_url=data.get('html_url')
            )
        except Exception as e:
            print(f"JSON 파일 처리 중 오류: {e}")
            sys.exit(1)
    
    # 명령행 인자로 입력받는 경우
    else:
        conversation_summary = sys.argv[1]
        prd_url = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != 'None' else None
        image_url = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != 'None' else None
        html_url = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != 'None' else None
        
        prd_file = agent.generate_prd(
            conversation_summary=conversation_summary,
            prd_url=prd_url,
            image_url=image_url,
            html_url=html_url
        )
    
    print(f"✅ PRD 파일이 성공적으로 생성되었습니다: {prd_file}")
    
    # 생성된 파일 내용 미리보기
    with open(prd_file, 'r', encoding='utf-8') as f:
        content = f.read()
        print("\n" + "="*50)
        print("생성된 PRD 미리보기:")
        print("="*50)
        print(content[:500] + "..." if len(content) > 500 else content)

if __name__ == "__main__":
    main()
