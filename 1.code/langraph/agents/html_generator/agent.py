from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

def generate_html(state):
    """PRD를 바탕으로 HTML 코드 생성"""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    prompt = f"""
    다음 PRD를 바탕으로 완전한 HTML 코드를 생성해주세요:
    
    PRD: {state.get('prd', '')}
    
    생성할 HTML 요구사항:
    - 완전한 HTML5 문서 구조
    - 반응형 CSS 포함
    - 접근성 고려
    - 모던 웹 표준 준수
    - 인라인 CSS 및 JavaScript 포함
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    state["html_code"] = response.content
    state["messages"].append(f"HTML 코드 생성 완료: {len(response.content)} 문자")
    
    return state
