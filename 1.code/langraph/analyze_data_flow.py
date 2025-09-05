#!/usr/bin/env python3
"""
에이전트 간 데이터 전달 형태 분석
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

def analyze_data_flow():
    """각 에이전트 간 데이터 전달 형태 분석"""
    print("🔍 에이전트 간 데이터 전달 형태 분석")
    
    # 테스트 결과 파일들 확인
    results_dir = project_root / "test_results"
    
    files_to_analyze = [
        ("workflow_prd.md", "PRD Generator → HTML Generator"),
        ("workflow_html.html", "HTML Generator → Code Reviewer"),
        ("workflow_review.md", "Code Reviewer → HTML Tester"),
        ("workflow_test.md", "HTML Tester → 최종 결과")
    ]
    
    print("\n📊 각 단계별 출력 데이터 분석:")
    
    for filename, description in files_to_analyze:
        file_path = results_dir / filename
        
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"\n{description}")
            print(f"📁 파일: {filename}")
            print(f"📏 크기: {len(content):,} 문자")
            print(f"📝 형태: {get_content_type(content)}")
            print(f"🔤 첫 100자: {content[:100].replace(chr(10), ' ')}")
            
            # 구조 분석
            analyze_structure(content, filename)
        else:
            print(f"\n❌ {filename} 파일을 찾을 수 없습니다.")

def get_content_type(content: str) -> str:
    """콘텐츠 타입 판별"""
    content_lower = content.lower().strip()
    
    if content_lower.startswith('<!doctype html') or content_lower.startswith('<html'):
        return "HTML 문서"
    elif content_lower.startswith('#') or '##' in content:
        return "Markdown 문서"
    elif content_lower.startswith('{') or content_lower.startswith('['):
        return "JSON 데이터"
    elif 'prd' in content_lower or 'requirements' in content_lower:
        return "PRD 문서"
    elif 'test' in content_lower and 'report' in content_lower:
        return "테스트 리포트"
    elif 'review' in content_lower or '개선사항' in content_lower:
        return "코드 리뷰"
    else:
        return "텍스트 문서"

def analyze_structure(content: str, filename: str):
    """콘텐츠 구조 분석"""
    lines = content.split('\n')
    
    if filename.endswith('.md'):
        # Markdown 구조 분석
        headers = [line for line in lines if line.startswith('#')]
        print(f"   📋 섹션 수: {len(headers)}")
        if headers:
            print(f"   📑 주요 섹션: {', '.join(headers[:3])}")
    
    elif filename.endswith('.html'):
        # HTML 구조 분석
        if '<head>' in content:
            print(f"   🏷️ HTML 헤드 포함")
        if '<body>' in content:
            print(f"   📄 HTML 바디 포함")
        if '<style>' in content:
            print(f"   🎨 인라인 CSS 포함")
        if '<script>' in content:
            print(f"   ⚡ JavaScript 포함")
    
    # 공통 분석
    print(f"   📏 총 라인 수: {len(lines)}")
    print(f"   📊 평균 라인 길이: {sum(len(line) for line in lines) / len(lines):.1f}자")

def demonstrate_state_flow():
    """상태 전달 흐름 시연"""
    print("\n🔄 LangGraph 상태 전달 메커니즘:")
    
    # AgentState 구조 설명
    print("""
    📋 AgentState 구조:
    {
        "input_data": str,      # 초기 입력 데이터
        "prd": str,            # PRD Generator 출력 → HTML Generator 입력
        "html_code": str,      # HTML Generator 출력 → Code Reviewer 입력  
        "reviewed_html": str,  # Code Reviewer 출력 → HTML Tester 입력
        "test_result": str,    # HTML Tester 최종 출력
        "messages": List[str]  # 실행 로그
    }
    """)
    
    print("🔗 데이터 전달 흐름:")
    print("1️⃣ PRD Generator:")
    print("   입력: state['input_data']")
    print("   출력: state['prd'] = 생성된 PRD 문서")
    print("   형태: Markdown 형식의 요구사항 문서")
    
    print("\n2️⃣ HTML Generator:")
    print("   입력: state['prd']")
    print("   출력: state['html_code'] = 완전한 HTML 코드")
    print("   형태: HTML5 + CSS + JavaScript")
    
    print("\n3️⃣ Code Reviewer:")
    print("   입력: state['html_code']")
    print("   출력: state['reviewed_html'] = 리뷰 및 개선사항")
    print("   형태: Markdown 형식의 리뷰 문서")
    
    print("\n4️⃣ HTML Tester:")
    print("   입력: state['reviewed_html']")
    print("   출력: state['test_result'] = 테스트 결과")
    print("   형태: Markdown 형식의 테스트 리포트")

def show_actual_data_samples():
    """실제 데이터 샘플 보기"""
    print("\n📋 실제 전달 데이터 샘플:")
    
    results_dir = project_root / "test_results"
    
    # PRD 샘플
    prd_file = results_dir / "workflow_prd.md"
    if prd_file.exists():
        with open(prd_file, 'r', encoding='utf-8') as f:
            prd_content = f.read()
        
        print("\n1️⃣ PRD Generator → HTML Generator 전달 데이터:")
        print("   타입: Markdown 문서")
        print("   샘플:")
        print("   " + "\n   ".join(prd_content.split('\n')[:5]))
        print(f"   ... (총 {len(prd_content)} 문자)")
    
    # HTML 샘플
    html_file = results_dir / "workflow_html.html"
    if html_file.exists():
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        print("\n2️⃣ HTML Generator → Code Reviewer 전달 데이터:")
        print("   타입: HTML 문서")
        print("   샘플:")
        print("   " + "\n   ".join(html_content.split('\n')[:5]))
        print(f"   ... (총 {len(html_content)} 문자)")

def main():
    """메인 실행 함수"""
    analyze_data_flow()
    demonstrate_state_flow()
    show_actual_data_samples()
    
    print("\n✅ 분석 완료!")
    print("\n💡 핵심 포인트:")
    print("   • 모든 데이터는 문자열(str) 형태로 전달")
    print("   • LangGraph StateGraph의 공유 상태를 통해 전달")
    print("   • 각 에이전트는 이전 에이전트의 출력을 직접 참조")
    print("   • 데이터 형식: Markdown, HTML, 텍스트 등 다양")

if __name__ == "__main__":
    main()
