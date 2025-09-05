#!/usr/bin/env python3
"""
전체 4개 에이전트 워크플로우 순차 실행 테스트
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

from main import create_workflow

def test_sequential_workflow():
    """순차적 워크플로우 테스트"""
    print("🚀 전체 워크플로우 순차 실행 테스트 시작")
    
    # 워크플로우 생성
    workflow = create_workflow()
    
    # 테스트용 입력 데이터
    test_input = """
    여성 의류 쇼핑몰 메인 페이지를 만들어주세요.
    
    요구사항:
    - 반응형 디자인
    - 상품 그리드 레이아웃
    - 검색 기능
    - 장바구니 기능
    - 깔끔하고 모던한 디자인
    """
    
    # 초기 상태 설정
    initial_state = {
        "input_data": test_input.strip(),
        "prd": "",
        "html_code": "",
        "reviewed_html": "",
        "test_result": "",
        "messages": []
    }
    
    print(f"📝 입력 데이터: {len(initial_state['input_data'])} 문자")
    
    try:
        # 워크플로우 실행
        print("\n🔄 워크플로우 실행 중...")
        result = workflow.invoke(initial_state)
        
        # 각 단계별 결과 검증
        print("\n📊 단계별 결과 검증:")
        
        # 1. PRD Generator 결과
        prd_result = result.get("prd", "")
        print(f"1️⃣ PRD Generator: {len(prd_result)} 문자 생성")
        if prd_result:
            print(f"   ✅ PRD 생성 성공")
        else:
            print(f"   ❌ PRD 생성 실패")
            return False
        
        # 2. HTML Generator 결과
        html_result = result.get("html_code", "")
        print(f"2️⃣ HTML Generator: {len(html_result)} 문자 생성")
        if html_result and "html" in html_result.lower():
            print(f"   ✅ HTML 코드 생성 성공")
        else:
            print(f"   ❌ HTML 코드 생성 실패")
            return False
        
        # 3. Code Reviewer 결과
        reviewed_result = result.get("reviewed_html", "")
        print(f"3️⃣ Code Reviewer: {len(reviewed_result)} 문자 생성")
        if reviewed_result:
            print(f"   ✅ 코드 리뷰 완료")
        else:
            print(f"   ❌ 코드 리뷰 실패")
            return False
        
        # 4. HTML Tester 결과
        test_result = result.get("test_result", "")
        print(f"4️⃣ HTML Tester: {len(test_result)} 문자 생성")
        if test_result:
            print(f"   ✅ 테스트 완료")
        else:
            print(f"   ❌ 테스트 실패")
            return False
        
        # 실행 로그 확인
        messages = result.get("messages", [])
        print(f"\n📋 실행 로그: {len(messages)}개")
        for i, msg in enumerate(messages, 1):
            print(f"   {i}. {msg}")
        
        # 결과 저장
        output_dir = project_root / "test_results"
        output_dir.mkdir(exist_ok=True)
        
        # 각 단계별 결과 저장
        with open(output_dir / "workflow_prd.md", 'w', encoding='utf-8') as f:
            f.write(prd_result)
        
        with open(output_dir / "workflow_html.html", 'w', encoding='utf-8') as f:
            f.write(html_result)
        
        with open(output_dir / "workflow_review.md", 'w', encoding='utf-8') as f:
            f.write(reviewed_result)
        
        with open(output_dir / "workflow_test.md", 'w', encoding='utf-8') as f:
            f.write(test_result)
        
        print(f"\n✅ 전체 워크플로우 테스트 성공!")
        print(f"📁 결과 파일들이 {output_dir}에 저장되었습니다.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 워크플로우 실행 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_sequential_workflow()
    sys.exit(0 if success else 1)
