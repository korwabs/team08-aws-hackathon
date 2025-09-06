#!/usr/bin/env python3
import sys
import json
import os
import uvicorn
from prd_agent import PRDAgent
from html_agent import HTMLAgent
from workflow import Workflow

def show_usage():
    print("사용법:")
    print("  서버 실행:")
    print("    python server.py start   # API 서버 시작 (포트 8000)")
    print("  직접 실행:")
    print("    python server.py workflow <conversation_summary> [prd_url] [image_url] [html_url]")
    print("    python server.py workflow --json <json_file>")
    print("    python server.py prd-run <conversation_summary> [prd_url] [image_url] [html_url]")
    print("    python server.py html-run <prd_file_path> [llm_api_url]")

def start_server():
    print("🚀 PRD & HTML Generator API 서버를 시작합니다...")
    print("📍 서버 주소: http://localhost:8000")
    print("📖 API 문서: http://localhost:8000/docs")
    print("🔍 헬스 체크: http://localhost:8000/health")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

def run_workflow(args):
    workflow = Workflow()
    
    if args[0] == "--json":
        with open(args[1], 'r', encoding='utf-8') as f:
            data = json.load(f)
        result = workflow.run_complete_workflow(
            conversation_summary=data.get('conversation_summary', ''),
            prd_url=data.get('prd_url'),
            image_url=data.get('image_url'),
            html_url=data.get('html_url')
        )
    else:
        result = workflow.run_complete_workflow(
            conversation_summary=args[0],
            prd_url=args[1] if len(args) > 1 and args[1] != 'None' else None,
            image_url=args[2] if len(args) > 2 and args[2] != 'None' else None,
            html_url=args[3] if len(args) > 3 and args[3] != 'None' else None
        )
    
    print(f"\n📍 생성된 파일들:")
    print(f"   PRD: {result['prd_file']}")
    print(f"   HTML: {result['html_file']}")
    print(f"   브라우저: http://localhost:8000/html/index.html")

def run_prd_direct(args):
    agent = PRDAgent()
    
    if args[0] == "--json":
        with open(args[1], 'r', encoding='utf-8') as f:
            data = json.load(f)
        prd_file = agent.generate_prd(
            conversation_summary=data.get('conversation_summary', ''),
            prd_url=data.get('prd_url'),
            image_url=data.get('image_url'),
            html_url=data.get('html_url')
        )
    else:
        prd_file = agent.generate_prd(
            conversation_summary=args[0],
            prd_url=args[1] if len(args) > 1 and args[1] != 'None' else None,
            image_url=args[2] if len(args) > 2 and args[2] != 'None' else None,
            html_url=args[3] if len(args) > 3 and args[3] != 'None' else None
        )
    
    print(f"✅ PRD 파일 생성: {prd_file}")

def run_html_direct(args):
    if not os.path.exists(args[0]):
        print(f"오류: PRD 파일을 찾을 수 없습니다: {args[0]}")
        sys.exit(1)
    
    agent = HTMLAgent(args[1] if len(args) > 1 else "http://localhost:8000/llm")
    output_file = agent.generate_html(args[0])
    print(f"✅ HTML 파일 생성: {output_file}")

def main():
    if len(sys.argv) < 2:
        show_usage()
        sys.exit(1)
    
    command = sys.argv[1]
    args = sys.argv[2:]
    
    if command == "start":
        start_server()
    elif command == "workflow":
        if not args:
            show_usage()
            sys.exit(1)
        run_workflow(args)
    elif command == "prd-run":
        if not args:
            show_usage()
            sys.exit(1)
        run_prd_direct(args)
    elif command == "html-run":
        if not args:
            show_usage()
            sys.exit(1)
        run_html_direct(args)
    else:
        print(f"알 수 없는 명령어: {command}")
        show_usage()
        sys.exit(1)

if __name__ == "__main__":
    main()
