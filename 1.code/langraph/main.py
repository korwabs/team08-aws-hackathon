from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
import os

load_dotenv()

class AgentState(TypedDict):
    input_data: str
    summary: str
    prd: str
    html_code: str
    reviewed_html: str
    test_result: str
    messages: List[str]

def main():
    # 에이전트 워크플로우 실행
    workflow = create_workflow()
    
    # 초기 상태
    initial_state = {
        "input_data": "",
        "summary": "",
        "prd": "",
        "html_code": "",
        "reviewed_html": "",
        "test_result": "",
        "messages": []
    }
    
    result = workflow.invoke(initial_state)
    print("워크플로우 완료:", result)

def create_workflow():
    workflow = StateGraph(AgentState)
    
    # 에이전트들을 워크플로우에 추가
    from agents.data_summarizer.agent import summarize_data
    from agents.prd_generator.agent import generate_prd
    from agents.html_generator.agent import generate_html
    from agents.code_reviewer.agent import review_code
    from agents.html_tester.agent import test_html
    
    workflow.add_node("summarizer", summarize_data)
    workflow.add_node("prd_generator", generate_prd)
    workflow.add_node("html_generator", generate_html)
    workflow.add_node("code_reviewer", review_code)
    workflow.add_node("html_tester", test_html)
    
    # 워크플로우 연결
    workflow.set_entry_point("summarizer")
    workflow.add_edge("summarizer", "prd_generator")
    workflow.add_edge("prd_generator", "html_generator")
    workflow.add_edge("html_generator", "code_reviewer")
    workflow.add_edge("code_reviewer", "html_tester")
    workflow.add_edge("html_tester", END)
    
    return workflow.compile()

if __name__ == "__main__":
    main()
