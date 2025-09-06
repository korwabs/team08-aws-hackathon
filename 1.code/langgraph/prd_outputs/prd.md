# Product Requirements Document (PRD)

## 프로젝트 개요

### 프로젝트명
**FashionHub** - 20-30대 여성을 위한 트렌디 패션 온라인 쇼핑몰

### 비즈니스 목표
- 20-30대 여성 고객을 대상으로 한 패션 이커머스 플랫폼 구축
- 모바일 최적화를 통한 사용자 경험 극대화
- 직관적인 상품 검색 및 구매 프로세스 제공
- 효율적인 관리자 시스템을 통한 운영 최적화

### 타겟 사용자
- **주요 타겟**: 20-30대 여성
- **특성**: 트렌디한 패션 아이템 선호, 모바일 쇼핑 선호
- **행동 패턴**: 소셜미디어 활용도 높음, 빠른 결제 프로세스 선호

### 프로젝트 범위
- 고객용 쇼핑몰 웹사이트
- 관리자용 상품/주문 관리 시스템
- 결제 시스템 연동
- 반응형 웹 디자인

## 요구사항 분석

### 기능적 요구사항

#### 1. 고객 기능 (높은 우선순위)
- **상품 브라우징**
  - 상품 목록 페이지 (카테고리별, 필터링)
  - 상품 상세 페이지 (이미지 갤러리, 상세 정보, 리뷰)
  - 검색 기능
  
- **쇼핑 기능**
  - 장바구니 추가/수정/삭제
  - 위시리스트 기능
  - 결제 프로세스 (토스페이먼츠/아임포트 연동)
  
- **사용자 계정**
  - 회원가입/로그인
  - 주문 내역 조회
  - 개인정보 관리

#### 2. 관리자 기능 (중간 우선순위)
- **상품 관리**
  - 상품 등록/수정/삭제
  - 다중 이미지 업로드
  - 재고 관리
  
- **주문 관리**
  - 주문 현황 조회
  - 배송 상태 관리
  - 매출 통계

#### 3. 카테고리 구조
```
패션 아이템
├── 상의 (블라우스, 티셔츠, 셔츠)
├── 하의 (팬츠, 스커트, 레깅스)
├── 아우터 (코트, 자켓, 가디건)
├── 원피스 (미니, 미디, 맥시)
├── 액세서리 (가방, 주얼리, 벨트)
└── 신발 (힐, 플랫, 스니커즈)
```

### 비기능적 요구사항

#### 성능 요구사항
- 페이지 로딩 시간: 3초 이내
- 이미지 최적화: WebP 포맷 지원
- 동시 접속자: 1,000명 이상 지원

#### 보안 요구사항
- HTTPS 적용
- 개인정보 암호화
- 결제 정보 보안 (PCI DSS 준수)

#### 사용성 요구사항
- 모바일 우선 반응형 디자인
- 직관적인 네비게이션
- 접근성 표준 준수 (WCAG 2.1)

## 기술적 구현 사항

### 기술 스택
```javascript
// Frontend Stack
const frontendStack = {
  framework: "React 18.x",
  stateManagement: "Redux Toolkit",
  styling: "Styled-components + Tailwind CSS",
  routing: "React Router v6",
  httpClient: "Axios",
  imageOptimization: "React Image Gallery"
};

// Backend Stack
const backendStack = {
  runtime: "Node.js 18.x",
  framework: "Express.js",
  database: "MongoDB with Mongoose",
  authentication: "JWT + bcrypt",
  fileUpload: "Multer + AWS S3",
  paymentGateway: ["TossPayments", "Iamport"]
};
```

### 아키텍처 설계

#### 프론트엔드 구조
```
src/
├── components/
│   ├── common/          # 공통 컴포넌트
│   ├── product/         # 상품 관련 컴포넌트
│   ├── cart/           # 장바구니 컴포넌트
│   └── admin/          # 관리자 컴포넌트
├── pages/
├── hooks/              # 커스텀 훅
├── store/              # Redux 스토어
├── services/           # API 서비스
└── utils/              # 유틸리티 함수
```

#### 백엔드 API 설계
```javascript
// API 엔드포인트 구조
const apiEndpoints = {
  // 상품 관련
  products: {
    getAll: "GET /api/products",
    getById: "GET /api/products/:id",
    create: "POST /api/products",
    update: "PUT /api/products/:id",
    delete: "DELETE /api/products/:id",
    getByCategory: "GET /api/products/category/:category"
  },
  
  // 주문 관련
  orders: {
    create: "POST /api/orders",
    getByUser: "GET /api/orders/user/:userId",
    updateStatus: "PUT /api/orders/:id/status"
  },
  
  // 결제 관련
  payments: {
    process: "POST /api/payments/process",
    verify: "POST /api/payments/verify",
    cancel: "POST /api/payments/cancel"
  }
};
```

### 데이터베이스 스키마

#### 상품 스키마
```javascript
const productSchema = {
  _id: "ObjectId",
  name: "String",
  description: "String",
  price: "Number",
  category: "String",
  sizes: ["String"], // ["S", "M", "L", "XL"]
  colors: ["String"],
  images: ["String"], // 이미지 URL 배열
  stock: {
    S: "Number",
    M: "Number", 
    L: "Number",
    XL: "Number"
  },
  isActive: "Boolean",
  createdAt: "Date",
  updatedAt: "Date"
};
```

#### 주문 스키마
```javascript
const orderSchema = {
  _id: "ObjectId",
  userId: "ObjectId",
  items: [{
    productId: "ObjectId",
    quantity: "Number",
    size: "String",
    price: "Number"
  }],
  totalAmount: "Number",
  shippingAddress: "Object",
  paymentInfo: "Object",
  status: "String", // "pending", "paid", "shipped", "delivered"
  createdAt: "Date"
};
```

## HTML 에이전트 실행 가이드

### 개발 환경 설정

#### 1. 프로젝트 초기화
```bash
# React 앱 생성
npx create-react-app fashion-hub
cd fashion-hub

# 필요한 패키지 설치
npm install redux @reduxjs/toolkit react-redux
npm install react-router-dom axios
npm install styled-components tailwindcss
npm install react-image-gallery swiper
```

#### 2. 백엔드 설정
```bash
# 백엔드 디렉토리 생성
mkdir fashion-hub-backend
cd fashion-hub-backend

# 패키지 초기화 및 설치
npm init -y
npm install express mongoose cors dotenv
npm install jsonwebtoken bcryptjs multer
npm install @tosspayments/payment-sdk iamport
```

### 핵심 컴포넌트 구현

#### 상품 목록 컴포넌트
```javascript
// components/product/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../store/productSlice';

const ProductList = () => {
  const dispatch = useDispatch();
  const { products, loading, filters } = useSelector(state => state.products);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');

  useEffect(() => {
    dispatch(fetchProducts({ category: selectedCategory, size: selectedSize }));
  }, [dispatch, selectedCategory, selectedSize]);

  const categories = ['all', '상의', '하의', '아우터', '원피스', '액세서리', '신발'];
  const sizes = ['all', 'S', 'M', 'L', 'XL'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 필터 섹션 */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 카테고리 필터 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? '전체' : category}
                </button>
              ))}
            </div>
          </div>

          {/* 사이즈 필터 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">사이즈</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {size === 'all' ? '전체' : size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 상품 그리드 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

// 상품 카드 컴포넌트
const ProductCard = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="relative aspect-square overflow-hidden cursor-pointer"
        onMouseEnter={() => setCurrentImageIndex(1)}
        onMouseLeave={() => setCurrentImageIndex(0)}
      >
        <img
          src={product.images[currentImageIndex] || product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 flex space-x-1">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-black">
            {product.price.toLocaleString()}원
          </span>
          <div className="flex space-x-1">
            {product.sizes.map(size => (
              <span key={size} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {size}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
```

#### 장바구니 컴포넌트
```javascript
// components/cart/Cart.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart } from '../../store/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector(state => state.cart);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
  };

  const handleCheckout = () => {
    // 결제 프로세스 시작
    initiatePayment();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">장바구니</h1>
      
      {items.