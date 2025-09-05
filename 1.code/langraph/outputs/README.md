# Outputs Directory Structure

## 📁 폴더 구조

### `/prd_documents`
- **용도**: PRD Generator 에이전트 결과물 저장
- **파일 형식**: `.md` (Markdown)
- **내용**: Product Requirements Document
- **예시**: `shopping_mall_prd_20250905.md`

### `/html_applications`
- **용도**: HTML Generator, Code Reviewer, HTML Tester 최종 결과물 저장
- **파일 형식**: `.html` (HTML)
- **내용**: 완성된 웹 애플리케이션
- **예시**: `shopping_mall_app_20250905.html`

## 🔄 워크플로우
1. PRD Generator → `prd_documents/` 폴더에 .md 파일 저장
2. HTML Generator → 중간 결과 (메모리에서 처리)
3. Code Reviewer → 중간 결과 (메모리에서 처리)  
4. HTML Tester → `html_applications/` 폴더에 최종 .html 파일 저장
