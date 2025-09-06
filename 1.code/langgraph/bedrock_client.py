import boto3
import json
import os
from typing import Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class BedrockClient:
    def __init__(self):
        self.client = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        self.model_id = os.getenv('BEDROCK_MODEL_ID', 'us.anthropic.claude-sonnet-4-20250514-v1:0')
        self.max_tokens = int(os.getenv('MAX_TOKENS', '4096'))
        self.temperature = float(os.getenv('MODEL_TEMPERATURE', '0'))
        
        print(f"Bedrock 클라이언트 초기화: 모델 ID = {self.model_id}")
    
    def generate_text(self, prompt: str, max_tokens: Optional[int] = None) -> str:
        """Bedrock을 사용하여 텍스트를 생성합니다."""
        try:
            tokens = max_tokens or self.max_tokens
            
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": tokens,
                "temperature": self.temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
            
            print(f"Bedrock 호출 시작: 모델 {self.model_id}")
            
            response = self.client.invoke_model(
                body=body,
                modelId=self.model_id,
                accept='application/json',
                contentType='application/json'
            )
            
            response_body = json.loads(response.get('body').read())
            content = response_body.get('content', [{}])[0].get('text', '')
            
            print(f"Bedrock 응답 성공: {len(content)} 문자")
            return content
            
        except Exception as e:
            print(f"Bedrock 호출 오류: {e}")
            # 테스트용 더미 데이터 반환
            return self._get_dummy_response(prompt)
    
    def _get_dummy_response(self, prompt: str) -> str:
        """Bedrock 실패시 더미 응답을 생성합니다."""
        if "검색" in prompt or "조회" in prompt:
            return """
            <div>
                <h3>🔍 검색 결과 (더미 데이터)</h3>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr style="background-color: #f2f2f2;">
                        <th>항목</th><th>내용</th><th>상태</th>
                    </tr>
                    <tr><td>상품 A</td><td>재고 100개</td><td>판매중</td></tr>
                    <tr><td>상품 B</td><td>재고 50개</td><td>품절임박</td></tr>
                    <tr><td>상품 C</td><td>재고 200개</td><td>판매중</td></tr>
                </table>
                <p><em>※ Bedrock 연결 실패로 더미 데이터를 표시합니다.</em></p>
            </div>
            """
        elif "통계" in prompt or "차트" in prompt or "대시보드" in prompt:
            return """
            <div>
                <h3>📊 대시보드 통계 (더미 데이터)</h3>
                <div style="display: flex; gap: 20px; margin: 20px 0;">
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px;">
                        <h4>총 매출</h4>
                        <p style="font-size: 24px; color: #1976d2;">₩12,345,678</p>
                    </div>
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px;">
                        <h4>주문 수</h4>
                        <p style="font-size: 24px; color: #388e3c;">1,234건</p>
                    </div>
                    <div style="background: #fff3e0; padding: 15px; border-radius: 5px;">
                        <h4>고객 수</h4>
                        <p style="font-size: 24px; color: #f57c00;">567명</p>
                    </div>
                </div>
                <p><em>※ Bedrock 연결 실패로 더미 데이터를 표시합니다.</em></p>
            </div>
            """
        else:
            return """
            <div>
                <h3>📋 기능 상세 정보 (더미 데이터)</h3>
                <ul>
                    <li><strong>실시간 데이터:</strong> 시스템에서 실시간으로 업데이트되는 정보</li>
                    <li><strong>사용자 친화적:</strong> 직관적인 인터페이스 제공</li>
                    <li><strong>확장 가능:</strong> 필요에 따라 기능 추가 가능</li>
                </ul>
                <p>이 기능을 통해 효율적인 관리가 가능합니다.</p>
                <p><em>※ Bedrock 연결 실패로 더미 데이터를 표시합니다.</em></p>
            </div>
            """
