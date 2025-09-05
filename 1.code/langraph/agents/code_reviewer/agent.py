from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

def review_code(state):
    """생성된 HTML 코드를 리뷰하고 수정"""
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    prompt = f"""
    다음 HTML 코드를 리뷰하고 개선된 버전을 제공해주세요:
    
    HTML 코드:
    {state.get('html_code', '')}
    
    리뷰 기준:
    - 코드 품질 및 구조
    - 웹 표준 준수
    - 접근성 개선
    - 성능 최적화
    - 보안 고려사항
    - 브라우저 호환성
    
    개선된 HTML 코드를 제공해주세요.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    
    state["reviewed_html"] = response.content
    state["messages"].append(f"코드 리뷰 완료: 개선사항 적용됨")
    
    return state
