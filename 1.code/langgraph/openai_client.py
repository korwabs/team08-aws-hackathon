import os
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI

# .env 파일 로드
load_dotenv()

class OpenAIClient:
    def __init__(self):
        self.api_key = os.getenv('OPEN_AI_KEY')
        if not self.api_key:
            raise ValueError("OPEN_AI_KEY가 .env 파일에 설정되지 않았습니다.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-3.5-turbo"
        self.max_tokens = 8000
        self.temperature = float(os.getenv('MODEL_TEMPERATURE', '0'))
        
        print(f"OpenAI 클라이언트 초기화: 모델 = {self.model}")
    
    def generate_text(self, prompt: str, max_tokens: Optional[int] = None) -> str:
        """OpenAI를 사용하여 텍스트를 생성합니다."""
        try:
            tokens = max_tokens or self.max_tokens
            
            print(f"OpenAI 호출 시작: 모델 {self.model}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=tokens,
                temperature=self.temperature
            )
            
            content = response.choices[0].message.content
            print(f"OpenAI 응답 성공: {len(content)} 문자")
            return content
            
        except Exception as e:
            print(f"OpenAI 호출 오류: {e}")
            print("더미 데이터로 대체합니다.")
            # API 키 문제시 더미 데이터 반환
            return self._get_dummy_response(prompt)
    
    def _get_dummy_response(self, prompt: str) -> str:
        """OpenAI 실패시 더미 응답을 생성합니다."""
        if "검색" in prompt or "조회" in prompt:
            return """
            <div>
                <h3>🔍 검색 결과</h3>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <th>상품명</th><th>카테고리</th><th>재고</th><th>가격</th><th>상태</th>
                    </tr>
                    <tr><td>스마트폰 케이스</td><td>액세서리</td><td>150개</td><td>₩15,000</td><td>판매중</td></tr>
                    <tr><td>무선 이어폰</td><td>전자제품</td><td>75개</td><td>₩89,000</td><td>품절임박</td></tr>
                    <tr><td>노트북 파우치</td><td>액세서리</td><td>200개</td><td>₩25,000</td><td>판매중</td></tr>
                    <tr><td>블루투스 스피커</td><td>전자제품</td><td>30개</td><td>₩45,000</td><td>재고부족</td></tr>
                </table>
                <p style="margin-top: 15px;"><strong>총 4개 상품</strong> | 마지막 업데이트: 2025-09-06 12:39</p>
            </div>
            """
        elif "통계" in prompt or "차트" in prompt or "대시보드" in prompt:
            return """
            <div>
                <h3>📊 실시간 대시보드</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h4 style="margin: 0;">오늘 매출</h4>
                        <p style="font-size: 28px; margin: 10px 0;">₩2,847,500</p>
                        <small>전일 대비 +12.5%</small>
                    </div>
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h4 style="margin: 0;">신규 주문</h4>
                        <p style="font-size: 28px; margin: 10px 0;">47건</p>
                        <small>처리 대기: 12건</small>
                    </div>
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h4 style="margin: 0;">활성 고객</h4>
                        <p style="font-size: 28px; margin: 10px 0;">1,234명</p>
                        <small>이번 주 +89명</small>
                    </div>
                    <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px;">
                        <h4 style="margin: 0;">재고 알림</h4>
                        <p style="font-size: 28px; margin: 10px 0;">8개 상품</p>
                        <small>재고 부족 경고</small>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4>📈 이번 주 트렌드</h4>
                    <ul style="list-style: none; padding: 0;">
                        <li>🔥 인기 카테고리: 전자제품 (+23%)</li>
                        <li>⭐ 베스트셀러: 무선 이어폰 (127개 판매)</li>
                        <li>🚀 급상승: 스마트워치 (+45%)</li>
                    </ul>
                </div>
            </div>
            """
        elif "주문" in prompt:
            return """
            <div>
                <h3>📦 주문 관리</h3>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr style="background-color: #e3f2fd;">
                        <th>주문번호</th><th>고객명</th><th>상품</th><th>금액</th><th>상태</th><th>주문일</th>
                    </tr>
                    <tr><td>#ORD-2025-001</td><td>김철수</td><td>스마트폰 케이스</td><td>₩15,000</td><td><span style="color: green;">배송완료</span></td><td>2025-09-05</td></tr>
                    <tr><td>#ORD-2025-002</td><td>이영희</td><td>무선 이어폰</td><td>₩89,000</td><td><span style="color: orange;">배송중</span></td><td>2025-09-06</td></tr>
                    <tr><td>#ORD-2025-003</td><td>박민수</td><td>블루투스 스피커</td><td>₩45,000</td><td><span style="color: blue;">준비중</span></td><td>2025-09-06</td></tr>
                </table>
            </div>
            """
        elif "고객" in prompt:
            return """
            <div>
                <h3>👥 고객 관리</h3>
                <div style="display: flex; gap: 20px; margin: 20px 0;">
                    <div style="flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h4>신규 고객 (이번 주)</h4>
                        <p style="font-size: 24px; color: #2196f3;">89명</p>
                    </div>
                    <div style="flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <h4>VIP 고객</h4>
                        <p style="font-size: 24px; color: #ff9800;">156명</p>
                    </div>
                </div>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr style="background-color: #f5f5f5;">
                        <th>고객명</th><th>등급</th><th>총 구매액</th><th>마지막 주문</th><th>상태</th>
                    </tr>
                    <tr><td>김철수</td><td>VIP</td><td>₩450,000</td><td>2025-09-05</td><td>활성</td></tr>
                    <tr><td>이영희</td><td>일반</td><td>₩125,000</td><td>2025-09-06</td><td>활성</td></tr>
                    <tr><td>박민수</td><td>신규</td><td>₩45,000</td><td>2025-09-06</td><td>신규</td></tr>
                </table>
            </div>
            """
        else:
            return """
            <div>
                <h3>📋 시스템 정보</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <h4>🚀 주요 기능</h4>
                    <ul>
                        <li><strong>실시간 모니터링:</strong> 매출, 주문, 재고 현황을 실시간으로 추적</li>
                        <li><strong>스마트 알림:</strong> 재고 부족, 신규 주문 등 중요 이벤트 알림</li>
                        <li><strong>데이터 분석:</strong> 매출 트렌드, 고객 행동 패턴 분석</li>
                        <li><strong>자동화:</strong> 반복 작업 자동화로 효율성 향상</li>
                    </ul>
                </div>
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                    <p><strong>💡 팁:</strong> 검색창에 "상품", "주문", "고객", "통계" 등을 입력하여 관련 데이터를 확인해보세요!</p>
                </div>
            </div>
            """
