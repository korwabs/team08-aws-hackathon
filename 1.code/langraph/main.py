"""
LangGraph 에이전트 워크플로우 메인 실행 파일
"""
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END, START
from typing import TypedDict, List
from pathlib import Path
from datetime import datetime
import os

# 환경 변수 로드
load_dotenv()

class AgentState(TypedDict):
    """에이전트 상태 정의"""
    input_data: str
    prd: str
    html_code: str
    reviewed_html: str
    test_result: str
    messages: List[str]

def save_prd_result(prd_content: str, filename: str = None) -> str:
    """PRD 결과물을 prd_documents 폴더에 저장"""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"prd_{timestamp}.md"
    
    output_dir = Path("outputs/prd_documents")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = output_dir / filename
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(prd_content)
    
    print(f"📄 PRD 저장: {file_path}")
    return str(file_path)

def save_html_result(html_content: str, filename: str = None) -> str:
    """최종 HTML 결과물을 html_applications 폴더에 저장"""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"app_{timestamp}.html"
    
    output_dir = Path("outputs/html_applications")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = output_dir / filename
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"🌐 HTML 앱 저장: {file_path}")
    return str(file_path)

def enhanced_prd_generator(state):
    """향상된 PRD 생성 후 파일 저장"""
    from agents.prd_generator.enhanced_agent import enhanced_generate_prd
    
    result_state = enhanced_generate_prd(state)
    
    # PRD 결과물 저장
    if result_state.get("prd"):
        save_prd_result(result_state["prd"])
    
    return result_state

def enhanced_html_generator(state):
    """향상된 HTML 생성 후 파일 저장"""
    from agents.html_generator.enhanced_agent import enhanced_generate_html
    
    result_state = enhanced_generate_html(state)
    
    # HTML Generator 결과물 저장
    if result_state.get("html_code"):
        save_html_result(result_state["html_code"], "current_app.html")
        print("📝 HTML Generator 결과물 저장됨")
    
    return result_state

def enhanced_code_reviewer(state):
    """코드 리뷰 후 수정된 HTML 파일 저장"""
    from agents.code_reviewer.agent import review_code
    
    result_state = review_code(state)
    
    # Code Reviewer가 수정한 HTML 추출 및 저장
    reviewed_content = result_state.get("reviewed_html", "")
    
    # 리뷰 내용에서 수정된 HTML 코드 추출
    improved_html = extract_improved_html_from_review(reviewed_content, state.get("html_code", ""))
    
    if improved_html:
        save_html_result(improved_html, "current_app.html")
        print("🔍 Code Reviewer 수정 결과물 저장됨")
        # 수정된 HTML을 상태에 업데이트
        result_state["html_code"] = improved_html
    
    return result_state

def enhanced_html_tester(state):
    """HTML 테스트 후 최종 HTML 파일 저장"""
    from agents.html_tester.agent import test_html
    
    result_state = test_html(state)
    
    # HTML Tester가 수정한 최종 HTML 추출 및 저장
    test_content = result_state.get("test_result", "")
    
    # 테스트 결과에서 최종 수정된 HTML 코드 추출
    final_html = extract_final_html_from_test(test_content, state.get("html_code", ""))
    
    if final_html:
        save_html_result(final_html, "current_app.html")
        print("🧪 HTML Tester 최종 결과물 저장됨")
        # 최종 HTML을 상태에 업데이트
        result_state["html_code"] = final_html
    
    return result_state

def extract_improved_html_from_review(review_content: str, original_html: str) -> str:
    """리뷰 내용에서 개선된 HTML 코드 추출"""
    import re
    
    # 리뷰에서 HTML 코드 블록 찾기
    html_pattern = r'```html\s*(.*?)\s*```'
    matches = re.findall(html_pattern, review_content, re.DOTALL | re.IGNORECASE)
    
    if matches:
        # 가장 완전한 HTML 코드 반환
        for match in matches:
            if '<!DOCTYPE html>' in match or '<html' in match:
                return match.strip()
    
    # HTML 코드 블록이 없으면 기본 개선사항 적용
    improved_html = original_html
    
    # 기본 개선사항 적용
    if "<!DOCTYPE html>" not in improved_html:
        improved_html = "<!DOCTYPE html>\n" + improved_html
    
    if "<html>" in improved_html and "lang=" not in improved_html:
        improved_html = improved_html.replace("<html>", '<html lang="ko">')
    
    if "<title>" not in improved_html and "<head>" in improved_html:
        improved_html = improved_html.replace("<head>", '<head>\n    <title>웹 애플리케이션</title>')
    
    return improved_html

def extract_final_html_from_test(test_content: str, current_html: str) -> str:
    """테스트 결과에서 최종 HTML 코드 추출"""
    import re
    
    # 테스트 결과에서 수정된 HTML 코드 찾기
    html_pattern = r'```html\s*(.*?)\s*```'
    matches = re.findall(html_pattern, test_content, re.DOTALL | re.IGNORECASE)
    
    if matches:
        # 가장 완전한 HTML 코드 반환
        for match in matches:
            if '<!DOCTYPE html>' in match or '<html' in match:
                return match.strip()
    
    # 테스트 결과에 HTML이 없으면 현재 HTML에 테스트 개선사항 적용
    final_html = current_html
    
    # 테스트 기반 개선사항 적용
    if "viewport" not in final_html and "<head>" in final_html:
        viewport_meta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        final_html = final_html.replace("<head>", f'<head>\n    {viewport_meta}')
    
    # JavaScript 오류 수정
    if "var " in final_html:
        final_html = final_html.replace("var ", "let ")
    
    return final_html

def create_workflow():
    """LangGraph 워크플로우 생성"""
    workflow = StateGraph(AgentState)
    
    # 에이전트 함수들 import
    from agents.html_generator.agent import generate_html
    from agents.code_reviewer.agent import review_code
    
    # 노드 추가 (모든 에이전트를 향상된 버전으로 사용)
    workflow.add_node("prd_generator", enhanced_prd_generator)
    workflow.add_node("html_generator", enhanced_html_generator)
    workflow.add_node("code_reviewer", enhanced_code_reviewer)
    workflow.add_node("html_tester", enhanced_html_tester)
    
    # 워크플로우 연결
    workflow.add_edge(START, "prd_generator")
    workflow.add_edge("prd_generator", "html_generator")
    workflow.add_edge("html_generator", "code_reviewer")
    workflow.add_edge("code_reviewer", "html_tester")
    workflow.add_edge("html_tester", END)
    
    return workflow.compile()

def main():
    """메인 실행 함수"""
    print("🚀 LangGraph 에이전트 워크플로우 시작")
    
    # 워크플로우 생성
    workflow = create_workflow()
    
    # 초기 상태 설정
    initial_state = {
        "input_data": "사용자가 음성으로 요청하면 실시간으로 HTML 데모 페이지를 생성하는 웹 서비스",
        "prd": "",
        "html_code": "",
        "reviewed_html": "",
        "test_result": "",
        "messages": []
    }
    
    try:
        # 워크플로우 실행
        result = workflow.invoke(initial_state)
        
        print("\n✅ 워크플로우 완료!")
        print(f"📝 PRD 길이: {len(result.get('prd', ''))} 문자")
        print(f"💻 HTML 코드 길이: {len(result.get('html_code', ''))} 문자")
        print(f"🔍 리뷰 결과 길이: {len(result.get('reviewed_html', ''))} 문자")
        print(f"🧪 테스트 결과 길이: {len(result.get('test_result', ''))} 문자")
        print(f"📋 처리 로그: {len(result.get('messages', []))}개")
        
        return result
        
    except Exception as e:
        print(f"❌ 워크플로우 실행 중 오류 발생: {e}")
        return None

if __name__ == "__main__":
    main()
