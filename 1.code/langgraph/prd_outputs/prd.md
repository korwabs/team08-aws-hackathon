# Product Requirements Document (PRD)

## 프로젝트 개요

### 프로젝트명
HTML 이미지 스타일 동적 수정 시스템

### 목적
기존 HTML 문서에 이미지 스타일을 동적으로 적용하여 시각적 일관성과 사용자 경험을 향상시키는 웹 애플리케이션 개발

### 범위
- 외부 HTML 문서 로드 및 파싱
- 이미지 URL 기반 스타일 분석 및 추출
- HTML 요소에 동적 스타일 적용
- 실시간 미리보기 및 결과 저장

## 요구사항 분석

### 기능적 요구사항
1. **HTML 문서 처리**
   - 외부 HTML URL로부터 문서 로드
   - DOM 구조 분석 및 이미지 요소 식별
   - 기존 스타일 속성 보존

2. **이미지 스타일 분석**
   - 참조 이미지 URL에서 색상 팔레트 추출
   - 이미지 스타일 특성 분석 (밝기, 대비, 색조)
   - CSS 스타일 규칙 자동 생성

3. **동적 스타일 적용**
   - 분석된 스타일을 HTML 요소에 적용
   - 반응형 디자인 고려
   - 브라우저 호환성 보장

### 비기능적 요구사항
- 성능: 3초 이내 스타일 적용 완료
- 호환성: 모던 브라우저 지원 (Chrome 90+, Firefox 88+, Safari 14+)
- 보안: CORS 정책 준수 및 XSS 방지

## 기술적 구현 사항

### 아키텍처 구성
```
Frontend (React/Vue.js) ↔ API Gateway ↔ Style Processing Service
                                    ↔ Image Analysis Service
                                    ↔ HTML Parser Service
```

### 핵심 기술 스택
- **Frontend**: React.js, CSS-in-JS (styled-components)
- **Backend**: Node.js, Express.js
- **이미지 처리**: Canvas API, Color Thief 라이브러리
- **HTML 파싱**: Cheerio, JSDOM

### LLM API 연동 코드 (JavaScript)

```javascript
// 이미지 스타일 분석을 위한 LLM API 호출
class StyleAnalysisService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
  }

  async analyzeImageStyle(imageUrl, htmlContent) {
    const prompt = `
      이미지 URL: ${imageUrl}
      HTML 내용: ${htmlContent}
      
      위 이미지의 스타일을 분석하여 HTML에 적용할 CSS 스타일을 생성해주세요.
      다음 형식으로 응답해주세요:
      {
        "colorPalette": ["#color1", "#color2", "#color3"],
        "typography": {"fontFamily": "...", "fontSize": "...", "lineHeight": "..."},
        "layout": {"spacing": "...", "borderRadius": "...", "shadows": "..."},
        "theme": "modern|classic|minimal|bold"
      }
    `;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('LLM API 호출 실패:', error);
      throw new Error('스타일 분석 실패');
    }
  }

  async generateDynamicCSS(styleAnalysis, htmlStructure) {
    const prompt = `
      스타일 분석 결과: ${JSON.stringify(styleAnalysis)}
      HTML 구조: ${htmlStructure}
      
      위 정보를 바탕으로 완전한 CSS 스타일시트를 생성해주세요.
      반응형 디자인과 접근성을 고려해주세요.
    `;

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// HTML 수정 및 스타일 적용 클래스
class HTMLStyleModifier {
  constructor(styleService) {
    this.styleService = styleService;
  }

  async loadHTML(htmlUrl) {
    try {
      const response = await fetch(htmlUrl);
      const htmlContent = await response.text();
      
      // CORS 프록시 사용 시
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${htmlUrl}`;
      const proxyResponse = await fetch(proxyUrl);
      return await proxyResponse.text();
    } catch (error) {
      console.error('HTML 로드 실패:', error);
      throw new Error('HTML 문서를 불러올 수 없습니다.');
    }
  }

  async modifyHTMLWithImageStyle(htmlUrl, imageUrl) {
    // 1. HTML 로드
    const htmlContent = await this.loadHTML(htmlUrl);
    
    // 2. DOM 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 3. 이미지 스타일 분석
    const styleAnalysis = await this.styleService.analyzeImageStyle(imageUrl, htmlContent);
    
    // 4. HTML 구조 분석
    const htmlStructure = this.analyzeHTMLStructure(doc);
    
    // 5. 동적 CSS 생성
    const dynamicCSS = await this.styleService.generateDynamicCSS(styleAnalysis, htmlStructure);
    
    // 6. 스타일 적용
    const modifiedHTML = this.applyStylesToHTML(doc, dynamicCSS, styleAnalysis);
    
    return {
      originalHTML: htmlContent,
      modifiedHTML: modifiedHTML,
      appliedStyles: dynamicCSS,
      styleAnalysis: styleAnalysis
    };
  }

  analyzeHTMLStructure(doc) {
    const structure = {
      images: doc.querySelectorAll('img').length,
      headings: doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      paragraphs: doc.querySelectorAll('p').length,
      containers: doc.querySelectorAll('div, section, article').length,
      hasNavigation: !!doc.querySelector('nav'),
      hasHeader: !!doc.querySelector('header'),
      hasFooter: !!doc.querySelector('footer')
    };
    
    return JSON.stringify(structure);
  }

  applyStylesToHTML(doc, css, styleAnalysis) {
    // 기존 스타일 태그 제거 또는 수정
    const existingStyles = doc.querySelectorAll('style');
    existingStyles.forEach(style => style.remove());
    
    // 새로운 스타일 태그 생성
    const styleTag = doc.createElement('style');
    styleTag.textContent = css;
    doc.head.appendChild(styleTag);
    
    // 인라인 스타일 적용 (필요한 경우)
    if (styleAnalysis.colorPalette) {
      const primaryColor = styleAnalysis.colorPalette[0];
      const secondaryColor = styleAnalysis.colorPalette[1];
      
      // 주요 요소에 색상 적용
      doc.querySelectorAll('h1, h2, h3').forEach(heading => {
        heading.style.color = primaryColor;
      });
      
      doc.querySelectorAll('a').forEach(link => {
        link.style.color = secondaryColor;
      });
    }
    
    return doc.documentElement.outerHTML;
  }
}
```

## HTML 에이전트 실행 가이드

### 설치 및 설정

```bash
# 프로젝트 초기화
npm init -y
npm install express cors cheerio canvas color-thief-node

# 개발 의존성 설치
npm install --save-dev nodemon jest
```

### 실행 단계

1. **환경 설정**
```javascript
// config.js
module.exports = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CORS_PROXY: 'https://cors-anywhere.herokuapp.com/',
  MAX_FILE_SIZE: '10MB',
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp']
};
```

2. **서버 실행**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const StyleAnalysisService = require('./services/StyleAnalysisService');
const HTMLStyleModifier = require('./services/HTMLStyleModifier');

const app = express();
app.use(cors());
app.use(express.json());

const styleService = new StyleAnalysisService(process.env.OPENAI_API_KEY);
const htmlModifier = new HTMLStyleModifier(styleService);

app.post('/api/modify-html', async (req, res) => {
  try {
    const { htmlUrl, imageUrl } = req.body;
    
    // 입력 검증
    if (!htmlUrl || !imageUrl) {
      return res.status(400).json({ error: '필수 매개변수가 누락되었습니다.' });
    }
    
    const result = await htmlModifier.modifyHTMLWithImageStyle(htmlUrl, imageUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('서버가 포트 3000에서 실행 중입니다.');
});
```

3. **클라이언트 사용법**
```javascript
// 사용 예시
const modifier = new HTMLStyleModifier(new StyleAnalysisService('your-api-key'));

modifier.modifyHTMLWithImageStyle(
  'https://example.com/page.html',
  'https://example.com/reference-image.jpg'
).then(result => {
  console.log('수정된 HTML:', result.modifiedHTML);
  console.log('적용된 스타일:', result.appliedStyles);
});
```

## 데이터 처리 요구사항

### 입력 데이터 검증
- **HTML URL**: 유효한 HTTP/HTTPS URL, 접근 가능한 리소스
- **이미지 URL**: 지원되는 이미지 형식 (JPEG, PNG, WebP)
- **파일 크기**: 최대 10MB 제한

### 데이터 플로우
```
1. 사용자 입력 → 2. URL 검증 → 3. 리소스 로드 → 4. 스타일 분석 
→ 5. CSS 생성 → 6. HTML 수정 → 7. 결과 반환
```

### 캐싱 전략
- 이미지 스타일 분석 결과: 24시간 캐시
- HTML 구조 분석: 1시간 캐시
- 생성된 CSS: 사용자 세션 동안 유지

### 에러 처리
```javascript
const ErrorHandler = {
  NETWORK_ERROR: 'NETWORK_001',
  INVALID_URL: 'VALIDATION_001',
  UNSUPPORTED_FORMAT: 'FORMAT_001',
  API_LIMIT_EXCEEDED: 'API_001',
  
  handle(error) {
    switch(error.code) {
      case this.NETWORK_ERROR:
        return { message: '네트워크 연결을 확인해주세요.', retry: true };
      case this.INVALID_URL:
        return { message: '유효하지 않은 URL입니다.', retry: false };
      default:
        return { message: '알 수 없는 오류가 발생했습니다.', retry: true };
    }
  }
};
```

## 품질 보증 체크리스트

### 기능 테스트
- [ ] HTML 문서 로드 및 파싱 정상 동작
- [ ] 이미지 URL 접근 및 분석 성공
- [ ] CSS 스타일 생성 및 적용 확인
- [ ] 다양한 HTML 구조에서 동작 검증
- [ ] 반응형 디자인 적용 확인

### 성능 테스트
- [ ] 3초 이내 처리 완료 (일반적인 웹페이지 기준)
- [ ] 동시 요청 100개 처리 가능
- [ ] 메모리 사용량 500MB 이하 유지
- [ ] CPU 사용률 80% 이하 유지

### 보안 테스트
- [ ] XSS 공격 방어 확인
- [ ] CORS 정책 준수 검증
- [ ] 입력 데이터 검증 및 sanitization
- [ ] API 키 보안 관리 확인

### 호환성 테스트
- [ ] Chrome 90+ 브라우저 지원
- [ ] Firefox 88+ 브라우저 지원
- [ ] Safari 14+ 브라우저 지원
- [ ] 모바일 브라우저 호환성 확인

### 사용성 테스트
- [ ] 직관적인 사용자 인터페이스
- [ ] 명확한 오류 