# Product Requirements Document (PRD)

## 프로젝트 개요

### 프로젝트명
온라인 쇼핑몰 관리자 대시보드

### 목적
쇼핑몰 운영자가 상품, 주문, 고객, 매출을 효율적으로 관리할 수 있는 통합 관리 시스템 구축

### 주요 기능
- 상품 관리 (등록, 수정, 삭제, 재고 관리)
- 주문 처리 (주문 조회, 상태 변경, 배송 관리)
- 고객 관리 (고객 정보 조회, 문의 처리)
- 매출 통계 (일/월/년 매출, 차트 시각화)

### 타겟 사용자
- 쇼핑몰 관리자
- 운영팀 직원
- 마케팅 담당자

## 요구사항 분석

### 기능적 요구사항

#### 1. 상품 관리
- **상품 목록 조회**: 페이지네이션, 검색, 필터링
- **상품 등록**: 이미지 업로드, 카테고리 분류, 가격 설정
- **상품 수정**: 정보 변경, 재고 수량 조정
- **상품 삭제**: 소프트 삭제, 삭제 확인 모달

#### 2. 주문 처리
- **주문 목록**: 실시간 주문 현황, 상태별 필터
- **주문 상세**: 고객 정보, 주문 상품, 배송 정보
- **상태 관리**: 주문 확인 → 배송 준비 → 배송 중 → 배송 완료
- **배송 추적**: 택배사 연동, 송장 번호 관리

#### 3. 고객 관리
- **고객 목록**: 가입일, 주문 횟수, 총 구매액
- **고객 상세**: 주문 이력, 문의 내역, 적립금
- **문의 처리**: 1:1 문의, FAQ 관리
- **등급 관리**: VIP, 일반 고객 분류

#### 4. 매출 통계
- **대시보드**: 오늘 매출, 주문 수, 방문자 수
- **매출 차트**: 일별, 월별, 연별 매출 그래프
- **상품 분석**: 베스트셀러, 매출 기여도
- **고객 분석**: 신규/재구매 고객 비율

### 비기능적 요구사항
- **성능**: 페이지 로딩 시간 3초 이내
- **보안**: 관리자 인증, 권한별 접근 제어
- **호환성**: Chrome, Firefox, Safari 지원
- **반응형**: 태블릿, 모바일 대응

## 기술적 구현 사항

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **차트 라이브러리**: Chart.js
- **아이콘**: Font Awesome
- **API**: RESTful API, LLM API 연동

### 아키텍처 구조
```
├── index.html (메인 대시보드)
├── assets/
│   ├── css/
│   │   ├── bootstrap.min.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── bootstrap.bundle.min.js
│   │   ├── chart.min.js
│   │   ├── dashboard.js
│   │   └── api-client.js
│   └── images/
├── pages/
│   ├── products.html
│   ├── orders.html
│   ├── customers.html
│   └── analytics.html
└── components/
    ├── sidebar.html
    ├── header.html
    └── modals.html
```

### LLM API 연동 코드

```javascript
// api-client.js
class APIClient {
    constructor() {
        this.baseURL = 'https://api.openai.com/v1';
        this.apiKey = 'YOUR_API_KEY';
    }

    async generateProductDescription(productName, category) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `${category} 카테고리의 "${productName}" 상품에 대한 매력적인 상품 설명을 200자 이내로 작성해주세요.`
                    }],
                    max_tokens: 150,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('API 호출 오류:', error);
            return '상품 설명을 생성할 수 없습니다.';
        }
    }

    async generateSalesReport(salesData) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `다음 매출 데이터를 분석하여 인사이트와 개선 방안을 제시해주세요: ${JSON.stringify(salesData)}`
                    }],
                    max_tokens: 300,
                    temperature: 0.5
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('매출 분석 오류:', error);
            return '매출 분석을 생성할 수 없습니다.';
        }
    }

    async generateCustomerInsights(customerData) {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `고객 데이터를 바탕으로 마케팅 전략을 제안해주세요: ${JSON.stringify(customerData)}`
                    }],
                    max_tokens: 250,
                    temperature: 0.6
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('고객 분석 오류:', error);
            return '고객 분석을 생성할 수 없습니다.';
        }
    }
}

// 사용 예시
const apiClient = new APIClient();

// 상품 설명 자동 생성
document.getElementById('generateDescription').addEventListener('click', async () => {
    const productName = document.getElementById('productName').value;
    const category = document.getElementById('category').value;
    
    const description = await apiClient.generateProductDescription(productName, category);
    document.getElementById('productDescription').value = description;
});
```

### 동적 데이터 생성 함수

```javascript
// dashboard.js
class DashboardManager {
    constructor() {
        this.apiClient = new APIClient();
        this.init();
    }

    init() {
        this.loadDashboardData();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        // 모의 데이터 생성
        const mockData = this.generateMockData();
        
        // 대시보드 위젯 업데이트
        this.updateDashboardWidgets(mockData);
        
        // 차트 렌더링
        this.renderCharts(mockData);
        
        // AI 인사이트 생성
        await this.generateAIInsights(mockData);
    }

    generateMockData() {
        const today = new Date();
        const salesData = [];
        
        // 최근 30일 매출 데이터 생성
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            salesData.push({
                date: date.toISOString().split('T')[0],
                sales: Math.floor(Math.random() * 1000000) + 500000,
                orders: Math.floor(Math.random() * 100) + 50,
                visitors: Math.floor(Math.random() * 1000) + 500
            });
        }

        return {
            todaySales: salesData[salesData.length - 1].sales,
            todayOrders: salesData[salesData.length - 1].orders,
            todayVisitors: salesData[salesData.length - 1].visitors,
            salesData: salesData,
            topProducts: [
                { name: '스마트폰 케이스', sales: 1500000, quantity: 300 },
                { name: '무선 이어폰', sales: 2800000, quantity: 140 },
                { name: '노트북 스탠드', sales: 950000, quantity: 190 }
            ],
            customerStats: {
                total: 15420,
                new: 234,
                returning: 1876
            }
        };
    }

    updateDashboardWidgets(data) {
        document.getElementById('todaySales').textContent = 
            new Intl.NumberFormat('ko-KR').format(data.todaySales) + '원';
        document.getElementById('todayOrders').textContent = data.todayOrders + '건';
        document.getElementById('todayVisitors').textContent = data.todayVisitors + '명';
    }

    renderCharts(data) {
        // 매출 차트
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: data.salesData.map(d => d.date),
                datasets: [{
                    label: '일별 매출',
                    data: data.salesData.map(d => d.sales),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '최근 30일 매출 추이'
                    }
                }
            }
        });

        // 상품별 매출 차트
        const productCtx = document.getElementById('productChart').getContext('2d');
        new Chart(productCtx, {
            type: 'doughnut',
            data: {
                labels: data.topProducts.map(p => p.name),
                datasets: [{
                    data: data.topProducts.map(p => p.sales),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 205, 86, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '상품별 매출 비중'
                    }
                }
            }
        });
    }

    async generateAIInsights(data) {
        const insightsContainer = document.getElementById('aiInsights');
        insightsContainer.innerHTML = '<div class="spinner-border" role="status"></div>';

        try {
            const salesInsight = await this.apiClient.generateSalesReport(data.salesData);
            const customerInsight = await this.apiClient.generateCustomerInsights(data.customerStats);

            insightsContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-header">
                        <i class="fas fa-chart-line"></i> 매출 분석
                    </div>
                    <div class="card-body">
                        <p>${salesInsight}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <i class="fas fa-users"></i> 고객 분석
                    </div>
                    <div class="card-body">
                        <p>${customerInsight}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            insightsContainer.innerHTML = `
                <div class="alert alert-warning">
                    AI 인사이트를 불러올 수 없습니다. 나중에 다시 시도해주세요.
                </div>
            `;
        }
    }

    setupEventListeners() {
        // 새로고침 버튼
        document.getElementById('refreshData')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // 날짜 범위 변경
        document.getElementById('dateRange')?.addEventListener('change', (e) => {
            this.updateDateRange(e.target.value);
        });
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
```

## HTML 에이전트 실행 가이드

### 1. 프로젝트 구조 생성
```bash
mkdir shopping-mall-dashboard
cd shopping-mall-dashboard
mkdir -p assets/{css,js,images} pages components
```

### 2. 필수 라이브러리 설치
```html
<!-- CDN 방식으로 포함 -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/