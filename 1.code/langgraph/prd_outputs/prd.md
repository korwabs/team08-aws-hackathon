# Product Requirements Document (PRD)

## 프로젝트 개요

### 프로젝트명
**TRENDY FASHION** - 20-30대 여성을 위한 패션 온라인 쇼핑몰

### 비즈니스 목표
- 20-30대 여성 고객을 대상으로 한 트렌디한 패션 아이템 판매
- 모바일 최적화된 쇼핑 경험 제공
- 직관적이고 세련된 UI/UX를 통한 브랜드 차별화
- 효율적인 재고 관리 및 주문 처리 시스템 구축

### 타겟 사용자
- **주요 타겟**: 20-30대 여성
- **특성**: 트렌디한 패션 아이템 선호, 모바일 쇼핑 활용도 높음
- **구매 패턴**: 온라인 쇼핑 선호, 소셜미디어 트렌드에 민감

### 프로젝트 범위
- B2C 패션 이커머스 플랫폼 개발
- 고객용 쇼핑 인터페이스 및 관리자용 백오피스 시스템
- 결제 시스템 연동 및 주문 관리 기능

## 요구사항 분석

### 기능적 요구사항

#### 1. 고객 대상 기능 (우선순위: 높음)
- **상품 카탈로그**
  - 상품 목록 페이지 (카테고리별 분류)
  - 상품 상세 페이지 (다중 이미지, 상세 정보)
  - 카테고리 필터링: 상의, 하의, 아우터, 원피스, 액세서리, 신발
  - 사이즈 필터링: S, M, L, XL

- **쇼핑 기능**
  - 장바구니 시스템 (상품 추가/삭제/수량 변경)
  - 결제 시스템 (토스페이먼츠 또는 아임포트 연동)
  - 주문 내역 조회

#### 2. 관리자 기능 (우선순위: 중간)
- **상품 관리**
  - 상품 등록/수정/삭제
  - 다중 이미지 업로드 지원
  - 카테고리 및 사이즈 옵션 설정

- **주문 관리**
  - 주문 내역 조회 및 상태 관리
  - 배송 정보 관리

- **재고 관리**
  - 재고 수량 관리
  - 품절 상품 자동 표시

#### 3. 부가 기능 (우선순위: 낮음)
- 상품 검색 기능
- 상품 리뷰 시스템
- 위시리스트 기능

### 비기능적 요구사항

#### 성능 요구사항
- 페이지 로딩 시간: 3초 이내
- 동시 접속자 처리: 최소 100명
- 이미지 최적화를 통한 빠른 로딩

#### 보안 요구사항
- HTTPS 적용
- 결제 정보 암호화
- 개인정보 보호 정책 준수

#### 호환성 요구사항
- 모바일 브라우저 최적화 (iOS Safari, Android Chrome)
- 데스크톱 브라우저 지원 (Chrome, Firefox, Safari, Edge)

## 기술적 구현 사항

### 기술 스택

#### 프론트엔드
```javascript
// 기술 스택 구성
const techStack = {
  framework: "React 18+",
  stateManagement: "Redux Toolkit",
  styling: "CSS Modules + Styled Components",
  routing: "React Router v6",
  httpClient: "Axios",
  buildTool: "Vite"
};
```

#### 백엔드
```javascript
// 서버 구성
const serverConfig = {
  runtime: "Node.js 18+",
  framework: "Express.js",
  database: "MongoDB",
  orm: "Mongoose",
  authentication: "JWT",
  fileUpload: "Multer + AWS S3"
};
```

#### 결제 시스템 연동
```javascript
// 결제 시스템 설정
const paymentConfig = {
  primary: "토스페이먼츠",
  fallback: "아임포트",
  supportedMethods: ["카드결제", "계좌이체", "가상계좌"]
};

// 토스페이먼츠 연동 예시
const initializePayment = async (orderData) => {
  const tossPayments = TossPayments("클라이언트_키");
  
  await tossPayments.requestPayment('카드', {
    amount: orderData.amount,
    orderId: orderData.orderId,
    orderName: orderData.orderName,
    customerName: orderData.customerName,
    successUrl: `${window.location.origin}/payment/success`,
    failUrl: `${window.location.origin}/payment/fail`,
  });
};
```

### 데이터베이스 설계

#### 상품 스키마
```javascript
const productSchema = {
  _id: "ObjectId",
  name: "String",
  description: "String",
  price: "Number",
  category: "String", // 상의, 하의, 아우터, 원피스, 액세서리, 신발
  sizes: ["String"], // S, M, L, XL
  images: ["String"], // 이미지 URL 배열
  stock: "Number",
  isActive: "Boolean",
  createdAt: "Date",
  updatedAt: "Date"
};
```

#### 주문 스키마
```javascript
const orderSchema = {
  _id: "ObjectId",
  orderNumber: "String",
  customerId: "ObjectId",
  items: [{
    productId: "ObjectId",
    quantity: "Number",
    size: "String",
    price: "Number"
  }],
  totalAmount: "Number",
  status: "String", // pending, paid, shipped, delivered, cancelled
  paymentMethod: "String",
  shippingAddress: "Object",
  createdAt: "Date"
};
```

### API 설계

#### 상품 관련 API
```javascript
// 상품 목록 조회
GET /api/products?category={category}&size={size}&page={page}&limit={limit}

// 상품 상세 조회
GET /api/products/:id

// 상품 등록 (관리자)
POST /api/admin/products
Content-Type: multipart/form-data

// 상품 수정 (관리자)
PUT /api/admin/products/:id

// 상품 삭제 (관리자)
DELETE /api/admin/products/:id
```

#### 주문 관련 API
```javascript
// 주문 생성
POST /api/orders

// 주문 내역 조회
GET /api/orders/:customerId

// 주문 상태 업데이트 (관리자)
PUT /api/admin/orders/:id/status
```

## 이미지 기반 스타일 가이드

**중요: HTML 생성 시 아래 CSS 정보만 사용하고 다른 CSS는 생성하지 마세요.**

## CSS 스타일 가이드

### 색상 팔레트
- 주요 색상: #6366F1 (메인 브랜드 컬러, 버튼 및 강조 요소)
- 보조 색상: #EC4899 (핑크 액센트, 프로모션 배경)
- 배경 색상: #F8FAFC (전체 페이지 배경)
- 텍스트 색상: #1F2937 (메인 텍스트), #6B7280 (보조 텍스트)
- 그라데이션: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%) (메인 배너)

### 레이아웃 구조
- 전체 레이아웃: CSS Grid + Flexbox 하이브리드
- 컨테이너 너비: max-width: 1200px, margin: 0 auto
- 여백/패딩: 
  - 섹션 간격: 40px
  - 카드 내부 패딩: 20px
  - 버튼 패딩: 12px 24px

### 컴포넌트 스타일

#### 헤더 네비게이션
```css
.header {
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 16px 0;
}

.nav-menu {
  display: flex;
  gap: 32px;
  font-size: 14px;
  font-weight: 500;
}
```

#### 메인 배너
```css
.main-banner {
  background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
  border-radius: 16px;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;
}

.banner-title {
  font-size: 48px;
  font-weight: 800;
  color: #FFFFFF;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.banner-subtitle {
  font-size: 24px;
  font-weight: 600;
  color: #FFFFFF;
  margin-top: 16px;
}
```

#### 사이드바 메뉴
```css
.sidebar {
  background: #6366F1;
  width: 200px;
  padding: 24px 0;
  border-radius: 0 0 16px 16px;
}

.sidebar-button {
  background: transparent;
  color: #FFFFFF;
  border: none;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
```

#### 검색바
```css
.search-container {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  max-width: 500px;
}

.search-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.search-button {
  background: #6366F1;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
```

#### 카테고리 태그
```css
.category-tags {
  display: flex;
  gap: 12px;
  margin: 24px 0;
}

.category-tag {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s ease;
}

.category-tag:hover {
  background: #F3F4F6;
  border-color: #6366F1;
}
```

#### 제품 카드
```css
.product-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 20px;
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.product-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #DC2626;
}
```

#### 우측 사이드바 (쿠폰/추천)
```css
.right-sidebar {
  width: 280px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.coupon-section {
  background: linear-gradient(45deg, #FEF3C7, #FDE68A);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
}
```

### 반응형 디자인

#### 모바일 (768px 이하)
```css
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    order: -1;
  }
  
  .banner-title {
    font-size: 32px;
  }
  
  .right-sidebar {
    width: 100%;
    margin-top: 24px;
  }
}
```

#### 태블릿 (768px - 1024px)
```css
@media (min-width: 769px) and (max-width: 1024px) {
  .container {
    max-width: 100%;
    padding: 0 20px;
  }
  
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

#### 데스크톱 (1024px 이상)
```css
@media (min-width: 1025px) {
  .main-layout {
    display: grid;
    