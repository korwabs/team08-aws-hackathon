#!/usr/bin/env python3
"""
PRD Generator 시스템 테스트
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

from agents.prd_generator.agent import generate_prd
from core.config import config_manager

def load_test_data():
    """테스트 데이터 로드"""
    test_data_dir = project_root / "test_data"
    
    # 대화 내용 로드
    conversation_file = test_data_dir / "sample_conversation.txt"
    conversation_content = ""
    if conversation_file.exists():
        with open(conversation_file, 'r', encoding='utf-8') as f:
            conversation_content = f.read()
    
    # 이미지 파일 목록
    image_files = []
    for img_file in test_data_dir.glob("*.png"):
        image_files.append(img_file.name)
    
    # 입력 데이터 구성
    input_data = f"""
## 프로젝트 개요
여성 의류 쇼핑몰 UX 고도화 프로젝트

## 벤치마킹 분석 자료
다음 스크린샷들을 분석하여 얻은 인사이트:
{', '.join(image_files)}

## 회의록 내용
{conversation_content}

## 요구사항
위 자료를 바탕으로 사용자 친화적인 쇼핑몰 개선을 위한 상세한 PRD를 작성해주세요.
"""
    
    return input_data

def main():
    """메인 테스트 함수"""
    print("🚀 PRD Generator 시스템 테스트 시작")
    print(f"📁 프로젝트 루트: {project_root}")
    
    # 환경 설정 확인
    print(f"🔧 AWS Region: {config_manager.model_config.region}")
    print(f"🤖 Model ID: {config_manager.model_config.model_id}")
    
    # 테스트 데이터 로드
    print("📊 테스트 데이터 로드 중...")
    input_data = load_test_data()
    print(f"✅ 입력 데이터 크기: {len(input_data)} 문자")
    
    # 초기 상태 설정
    state = {
        "input_data": input_data,
        "messages": [],
        "prd": ""
    }
    
    # PRD 생성 실행
    print("🔄 PRD 생성 중...")
    try:
        result_state = generate_prd(state)
        
        # 결과 저장
        output_dir = project_root / "test_results"
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / "generated_prd.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result_state["prd"])
        
        print(f"✅ PRD 생성 완료!")
        print(f"📄 출력 파일: {output_file}")
        print(f"📏 생성된 PRD 크기: {len(result_state['prd'])} 문자")
        
        # 실행 로그 출력
        if result_state["messages"]:
            print("\n📋 실행 로그:")
            for msg in result_state["messages"]:
                print(f"   {msg}")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
