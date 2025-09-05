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
    """PRD 생성 후 파일 저장"""
    from agents.prd_generator.agent import generate_prd
    
    result_state = generate_prd(state)
    
    # PRD 결과물 저장
    if result_state.get("prd"):
        save_prd_result(result_state["prd"])
    
    return result_state

def enhanced_html_tester(state):
    """HTML 테스트 후 최종 HTML 파일 저장"""
    from agents.html_tester.agent import test_html
    
    result_state = test_html(state)
    
    # 최종 HTML 결과물 저장 (리뷰된 HTML 기반)
    if result_state.get("reviewed_html"):
        save_html_result(result_state["reviewed_html"])
    
    return result_state

def create_workflow():
    """LangGraph 워크플로우 생성"""
    workflow = StateGraph(AgentState)
    
    # 에이전트 함수들 import
    from agents.html_generator.agent import generate_html
    from agents.code_reviewer.agent import review_code
    
    # 노드 추가 (PRD와 HTML Tester는 향상된 버전 사용)
    workflow.add_node("prd_generator", enhanced_prd_generator)
    workflow.add_node("html_generator", generate_html)
    workflow.add_node("code_reviewer", review_code)
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
