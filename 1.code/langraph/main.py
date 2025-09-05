"""
LangGraph 에이전트 워크플로우 메인 실행 파일
"""
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END, START
from typing import TypedDict, List
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

def create_workflow():
    """LangGraph 워크플로우 생성"""
    workflow = StateGraph(AgentState)
    
    # 에이전트 함수들 import
    from agents.prd_generator.agent import generate_prd
    from agents.html_generator.agent import generate_html
    from agents.code_reviewer.agent import review_code
    from agents.html_tester.agent import test_html
    
    # 노드 추가
    workflow.add_node("prd_generator", generate_prd)
    workflow.add_node("html_generator", generate_html)
    workflow.add_node("code_reviewer", review_code)
    workflow.add_node("html_tester", test_html)
    
    # 워크플로우 연결 (agent_rule.md 규칙 준수)
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
