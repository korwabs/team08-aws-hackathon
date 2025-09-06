# Product Requirements Document (PRD)

## 프로젝트 개요

### 프로젝트명
**TRENDY FASHION** - 20-30대 여성을 위한 패션 온라인 쇼핑몰

### 비즈니스 목표
- 20-30대 여성 고객을 대상으로 한 트렌디한 패션 아이템 판매
- 모바일 최적화된 쇼핑 경험 제공
- 직관적이고 세련된 UI/UX를 통한 브랜드 차별화

### 타겟 사용자
- **주 타겟**: 20-30대 여성
- **특성**: 트렌디한 패션 아이템 선호, 모바일 쇼핑 활용도 높음
- **구매 패턴**: 빠른 결제 프로세스 선호, 시각적 정보 중시

### 프로젝트 범위
- 고객용 쇼핑몰 웹사이트
- 관리자용 상품/주문 관리 시스템
- 결제 시스템 연동
- 반응형 웹 디자인

## 요구사항 분석

### 기능적 요구사항

#### 1. 고객 기능 (우선순위: 높음)
```
F001. 상품 목록 조회
- 카테고리별 상품 분류 (상의, 하의, 아우터, 원피스, 액세서리, 신발)
- 사이즈별 필터링 (S, M, L, XL)
- 가격순, 인기순, 최신순 정렬

F002. 상품 상세 정보
- 다중 이미지 갤러리
- 상품 설명, 가격, 사이즈 정보
- 재고 현황 표시

F003. 장바구니 시스템
- 상품 추가/삭제/수량 변경
- 총 금액 계산
- 임시 저장 기능

F004. 결제 시스템
- 토스페이먼츠/아임포트 PG 연동
- 다양한 결제 수단 지원
- 주문 확인 및 영수증 발행
```

#### 2. 관리자 기능 (우선순위: 중간)
```
A001. 상품 관리
- 상품 등록/수정/삭제
- 다중 이미지 업로드
- 카테고리 및 사이즈 설정

A002. 주문 관리
- 주문 목록 조회
- 주문 상태 변경
- 배송 정보 관리

A003. 재고 관리
- 재고 현황 모니터링
- 재고 알림 설정
- 입출고 관리
```

### 비기능적 요구사항

#### 성능 요구사항
- 페이지 로딩 시간: 3초 이내
- 동시 접속자: 1,000명 지원
- 이미지 최적화: WebP 포맷 지원

#### 보안 요구사항
- HTTPS 통신 필수
- 결제 정보 암호화
- SQL Injection 방지
- XSS 공격 방지

#### 호환성 요구사항
- 모바일 브라우저: iOS Safari, Android Chrome
- 데스크톱 브라우저: Chrome, Firefox, Safari, Edge
- 반응형 디자인: 320px ~ 1920px

## 기술적 구현 사항

### 기술 스택
```
Frontend: React 18.x
- React Router (페이지 라우팅)
- Styled-components (CSS-in-JS)
- Axios (HTTP 통신)
- React Query (상태 관리)

Backend: Node.js 18.x
- Express.js (웹 프레임워크)
- MongoDB (데이터베이스)
- Mongoose (ODM)
- Multer (파일 업로드)

Payment: 토스페이먼츠 또는 아임포트
Infrastructure: AWS EC2, S3, CloudFront
```

### 데이터베이스 스키마
```javascript
// 상품 스키마
const ProductSchema = {
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String, // 상의, 하의, 아우터, 원피스, 액세서리, 신발
  sizes: [String], // S, M, L, XL
  images: [String],
  stock: Number,
  createdAt: Date,
  updatedAt: Date
};

// 주문 스키마
const OrderSchema = {
  _id: ObjectId,
  orderNumber: String,
  customerInfo: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  items: [{
    productId: ObjectId,
    quantity: Number,
    size: String,
    price: Number
  }],
  totalAmount: Number,
  paymentStatus: String,
  orderStatus: String,
  createdAt: Date
};
```

### API 엔드포인트 설계
```javascript
// 상품 관련 API
GET /api/products - 상품 목록 조회
GET /api/products/:id - 상품 상세 조회
POST /api/products - 상품 등록 (관리자)
PUT /api/products/:id - 상품 수정 (관리자)
DELETE /api/products/:id - 상품 삭제 (관리자)

// 주문 관련 API
POST /api/orders - 주문 생성
GET /api/orders - 주문 목록 조회 (관리자)
PUT /api/orders/:id - 주문 상태 변경 (관리자)

// 결제 관련 API
POST /api/payments/prepare - 결제 준비
POST /api/payments/complete - 결제 완료 처리
```

## HTML 에이전트 실행 가이드

### 프로젝트 구조
```
trendy-fashion/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   └── admin/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
└── README.md
```

### 개발 환경 설정
```bash
# 프론트엔드 설정
cd frontend
npm install
npm start

# 백엔드 설정
cd backend
npm install
npm run dev
```

### 핵심 컴포넌트 구현

#### 1. 상품 목록 컴포넌트
```javascript
// src/components/product/ProductList.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getProducts } from '../../api/productAPI';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    size: '',
    sortBy: 'latest'
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const response = await getProducts(filters);
      setProducts(response.data);
    } catch (error) {
      console.error('상품 조회 실패:', error);
    }
  };

  return (
    <Container>
      <FilterSection>
        <CategoryFilter>
          <select 
            value={filters.category} 
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="">전체 카테고리</option>
            <option value="상의">상의</option>
            <option value="하의">하의</option>
            <option value="아우터">아우터</option>
            <option value="원피스">원피스</option>
            <option value="액세서리">액세서리</option>
            <option value="신발">신발</option>
          </select>
        </CategoryFilter>
        
        <SizeFilter>
          <select 
            value={filters.size} 
            onChange={(e) => setFilters({...filters, size: e.target.value})}
          >
            <option value="">전체 사이즈</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </SizeFilter>
      </FilterSection>

      <ProductGrid>
        {products.map(product => (
          <ProductCard key={product._id}>
            <ProductImage src={product.images[0]} alt={product.name} />
            <ProductInfo>
              <ProductName>{product.name}</ProductName>
              <ProductPrice>{product.price.toLocaleString()}원</ProductPrice>
            </ProductInfo>
          </ProductCard>
        ))}
      </ProductGrid>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
`;

const ProductCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  padding: 15px;
`;

const ProductName = styled.h3`
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
`;

const ProductPrice = styled.p`
  font-size: 18px;
  font-weight: bold;
  color: #d4af37; /* 골드 컬러 */
`;

export default ProductList;
```

#### 2. 장바구니 컴포넌트
```javascript
// src/components/cart/Cart.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getCartItems, updateCartItem, removeCartItem } from '../../api/cartAPI';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchCartItems();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const fetchCartItems = async () => {
    try {
      const response = await getCartItems();
      setCartItems(response.data);
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
    }
  };

  const calculateTotal = () => {
    const total = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    setTotalAmount(total);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await updateCartItem(itemId, { quantity: newQuantity });
      setCartItems(cartItems.map(item => 
        item._id === itemId ? {...item, quantity: newQuantity} : item
      ));
    } catch (error) {
      console.error('수량 변경 실패:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeCartItem(itemId);
      setCartItems(cartItems.filter(item => item._id !== itemId));
    } catch (error) {
      console.error('상품 삭제 실패:', error);
    }
  };

  return (
    <Container>
      <Title>장바구니</Title>
      
      {cartItems.length === 0 ? (
        <EmptyCart>장바구니가 비어있습니다.</EmptyCart>
      ) : (
        <>
          <CartItemList>
            {cartItems.map(item => (
              <CartItem key={item._id}>
                <ItemImage src={item.product.images[0]} alt={item.product.name} />
                <ItemInfo>
                  <ItemName>{item.product.name}</ItemName>
                  <ItemSize>사이즈: {item.size}</ItemSize>
                  <ItemPrice>{item.price.toLocaleString()}원</ItemPrice>
                </ItemInfo>
                <QuantityControl>
                  <QuantityButton 
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  >
                    -
                  </QuantityButton>
                  <Quantity>{item.quantity}</Quantity>
                  <QuantityButton 
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  >
                    +
                  </QuantityButton>
                </QuantityControl>
                <RemoveButton onClick={() => handleRemoveItem(item._id)}>
                  삭제
                </RemoveButton>
              </CartItem>
            ))}
          </CartItemList>
          
          <CartSummary>
            <TotalAmount>총 금액: {totalAmount.toLocaleString()}원</TotalAmount>
            <CheckoutButton>결제하기</CheckoutButton>
          </CartSummary>
        </>
      )}
    </Container>
  );
};