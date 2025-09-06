# HTML 데모 생성 클라이언트 가이드

Deep Vibe Node Server의 HTML 데모 생성 기능을 위한 완전한 클라이언트 구현 가이드입니다.

## 🚀 개요

HTML 데모 생성 기능은 채팅방의 대화 내용을 기반으로 AI가 PRD(Product Requirements Document)와 HTML 데모를 자동 생성하는 기능입니다.

### 주요 특징
- **실시간 진행 상황**: WebSocket을 통한 실시간 진행 상황 업데이트
- **AI 기반 생성**: AWS Bedrock Claude를 활용한 PRD 및 HTML 생성
- **S3 업로드**: 생성된 파일을 자동으로 S3에 업로드
- **선택적 입력**: 이미지, PRD, HTML 템플릿을 선택적으로 제공 가능

## 📋 WebSocket 이벤트

### 클라이언트 → 서버

#### `generate-html-demo`
HTML 데모 생성을 요청합니다.

```javascript
socket.emit('generate-html-demo', {
    roomId: 'room-uuid',        // 필수: 채팅방 ID
    userId: 'user-id',          // 필수: 사용자 ID
    imageUrl: 'https://...',    // 선택: 참고할 이미지 URL
    prdUrl: 'https://...',      // 선택: 기존 PRD URL
    htmlUrl: 'https://...'      // 선택: HTML 템플릿 URL
});
```

### 서버 → 클라이언트

#### `html-demo-progress`
생성 진행 상황을 실시간으로 전달합니다.

```javascript
socket.on('html-demo-progress', (progress) => {
    // progress.step: 'summary' | 'fastapi' | 'upload'
    // progress.message: 진행 상황 메시지
});
```

#### `html-demo-complete`
생성 완료 시 결과를 전달합니다.

```javascript
socket.on('html-demo-complete', (result) => {
    // result.success: true
    // result.message: 성공 메시지
    // result.prdFile: 생성된 PRD 파일 S3 URL
    // result.htmlFile: 생성된 HTML 파일 S3 URL
});
```

#### `html-demo-error`
생성 실패 시 오류를 전달합니다.

```javascript
socket.on('html-demo-error', (error) => {
    // error.success: false
    // error.error: 오류 메시지
});
```

## 💻 기본 구현

### 1. 간단한 구현

```javascript
class SimpleHtmlDemo {
    constructor(socket) {
        this.socket = socket;
        this.setupEvents();
    }
    
    setupEvents() {
        this.socket.on('html-demo-progress', (progress) => {
            console.log(`[${progress.step}] ${progress.message}`);
        });
        
        this.socket.on('html-demo-complete', (result) => {
            console.log('생성 완료:', result);
            alert(`PRD: ${result.prdFile}\nHTML: ${result.htmlFile}`);
        });
        
        this.socket.on('html-demo-error', (error) => {
            console.error('생성 실패:', error.error);
            alert(`오류: ${error.error}`);
        });
    }
    
    generate(roomId, userId, options = {}) {
        this.socket.emit('generate-html-demo', {
            roomId,
            userId,
            ...options
        });
    }
}

// 사용법
const demo = new SimpleHtmlDemo(socket);
demo.generate('room-123', 'user-456');
```

### 2. 고급 구현 (UI 포함)

```javascript
class AdvancedHtmlDemo {
    constructor(socket, containerId) {
        this.socket = socket;
        this.container = document.getElementById(containerId);
        this.isGenerating = false;
        
        this.setupEvents();
        this.createUI();
    }
    
    setupEvents() {
        this.socket.on('html-demo-progress', (progress) => {
            this.updateProgress(progress);
        });
        
        this.socket.on('html-demo-complete', (result) => {
            this.showResult(result);
            this.isGenerating = false;
        });
        
        this.socket.on('html-demo-error', (error) => {
            this.showError(error);
            this.isGenerating = false;
        });
    }
    
    createUI() {
        this.container.innerHTML = `
            <div class="html-demo-widget">
                <h3>🎨 HTML 데모 생성</h3>
                
                <div class="input-section">
                    <input type="url" id="image-url" placeholder="이미지 URL (선택사항)">
                    <input type="url" id="prd-url" placeholder="PRD URL (선택사항)">
                    <input type="url" id="html-url" placeholder="HTML 템플릿 URL (선택사항)">
                    <button id="generate-btn">🚀 생성하기</button>
                </div>
                
                <div id="progress-section" style="display: none;">
                    <div class="progress-bar">
                        <div id="progress-fill"></div>
                    </div>
                    <div id="progress-text">준비 중...</div>
                </div>
                
                <div id="result-section" style="display: none;"></div>
            </div>
        `;
        
        // 이벤트 리스너 등록
        this.container.querySelector('#generate-btn').addEventListener('click', () => {
            this.startGeneration();
        });
    }
    
    startGeneration() {
        if (this.isGenerating) return;
        
        const imageUrl = this.container.querySelector('#image-url').value;
        const prdUrl = this.container.querySelector('#prd-url').value;
        const htmlUrl = this.container.querySelector('#html-url').value;
        
        // roomId와 userId는 전역 변수에서 가져온다고 가정
        if (!window.currentRoomId || !window.currentUserId) {
            alert('방에 입장하고 사용자를 설정해주세요.');
            return;
        }
        
        this.isGenerating = true;
        this.showProgress();
        
        this.socket.emit('generate-html-demo', {
            roomId: window.currentRoomId,
            userId: window.currentUserId,
            imageUrl: imageUrl || null,
            prdUrl: prdUrl || null,
            htmlUrl: htmlUrl || null
        });
    }
    
    showProgress() {
        this.container.querySelector('#progress-section').style.display = 'block';
        this.container.querySelector('#result-section').style.display = 'none';
        this.container.querySelector('#generate-btn').disabled = true;
    }
    
    updateProgress(progress) {
        const progressMap = {
            'summary': { percent: 33, text: '채팅 요약 생성 중...' },
            'fastapi': { percent: 66, text: 'AI가 PRD와 HTML 생성 중...' },
            'upload': { percent: 90, text: '파일 업로드 중...' }
        };
        
        const info = progressMap[progress.step];
        if (info) {
            this.container.querySelector('#progress-fill').style.width = `${info.percent}%`;
            this.container.querySelector('#progress-text').textContent = progress.message;
        }
    }
    
    showResult(result) {
        this.container.querySelector('#progress-section').style.display = 'none';
        this.container.querySelector('#generate-btn').disabled = false;
        
        const resultSection = this.container.querySelector('#result-section');
        resultSection.innerHTML = `
            <div class="success-result">
                <h4>✅ ${result.message}</h4>
                <div class="file-links">
                    <a href="${result.prdFile}" target="_blank" class="file-link prd">
                        📄 PRD 파일 보기
                    </a>
                    <a href="${result.htmlFile}" target="_blank" class="file-link html">
                        🌐 HTML 데모 보기
                    </a>
                </div>
            </div>
        `;
        resultSection.style.display = 'block';
    }
    
    showError(error) {
        this.container.querySelector('#progress-section').style.display = 'none';
        this.container.querySelector('#generate-btn').disabled = false;
        
        const resultSection = this.container.querySelector('#result-section');
        resultSection.innerHTML = `
            <div class="error-result">
                <h4>❌ 생성 실패</h4>
                <p>${error.error}</p>
                <button onclick="this.parentElement.parentElement.style.display='none'">
                    닫기
                </button>
            </div>
        `;
        resultSection.style.display = 'block';
    }
}

// 사용법
const advancedDemo = new AdvancedHtmlDemo(socket, 'demo-container');
```

## 🎨 CSS 스타일

```css
.html-demo-widget {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    background: #fafafa;
}

.html-demo-widget h3 {
    margin-top: 0;
    color: #333;
}

.input-section {
    margin-bottom: 20px;
}

.input-section input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.input-section button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(45deg, #007bff, #0056b3);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.input-section button:hover:not(:disabled) {
    background: linear-gradient(45deg, #0056b3, #004085);
    transform: translateY(-1px);
}

.input-section button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
}

#progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #007bff, #28a745);
    width: 0%;
    transition: width 0.5s ease;
}

#progress-text {
    text-align: center;
    color: #666;
    font-size: 14px;
}

.success-result {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 15px;
    border-radius: 6px;
}

.error-result {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 15px;
    border-radius: 6px;
}

.file-links {
    margin-top: 15px;
    display: flex;
    gap: 10px;
}

.file-link {
    display: inline-block;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    transition: all 0.3s ease;
}

.file-link.prd {
    background: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
}

.file-link.html {
    background: #f3e5f5;
    color: #7b1fa2;
    border: 1px solid #e1bee7;
}

.file-link:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

## 📱 완전한 HTML 예제

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML 데모 생성기</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        /* 위의 CSS 스타일 포함 */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .status-bar {
            background: #007bff;
            color: white;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .room-info {
            background: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        
        .room-info input {
            width: 200px;
            padding: 8px;
            margin: 0 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .room-info button {
            padding: 8px 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 HTML 데모 생성기</h1>
        
        <div class="status-bar" id="status">
            서버에 연결 중...
        </div>
        
        <div class="room-info">
            <label>방 ID:</label>
            <input type="text" id="room-id" placeholder="room-123">
            <button onclick="joinRoom()">입장</button>
            
            <label>사용자 ID:</label>
            <input type="text" id="user-id" placeholder="user-456">
            <button onclick="setUser()">설정</button>
        </div>
        
        <div id="demo-container"></div>
    </div>

    <script>
        // 전역 변수
        let socket;
        let currentRoomId = null;
        let currentUserId = null;
        let demoGenerator = null;

        // Socket.IO 연결
        function initSocket() {
            socket = io();
            
            socket.on('connect', () => {
                document.getElementById('status').textContent = '✅ 서버에 연결됨';
                document.getElementById('status').style.background = '#28a745';
                
                // HTML 데모 생성기 초기화
                demoGenerator = new AdvancedHtmlDemo(socket, 'demo-container');
            });
            
            socket.on('disconnect', () => {
                document.getElementById('status').textContent = '❌ 서버 연결 끊김';
                document.getElementById('status').style.background = '#dc3545';
            });
            
            socket.on('connect_error', (error) => {
                document.getElementById('status').textContent = '❌ 연결 실패';
                document.getElementById('status').style.background = '#dc3545';
                console.error('Connection error:', error);
            });
        }

        // 방 입장
        function joinRoom() {
            const roomId = document.getElementById('room-id').value.trim();
            if (!roomId) {
                alert('방 ID를 입력해주세요.');
                return;
            }
            
            currentRoomId = roomId;
            window.currentRoomId = roomId; // 전역 변수로도 설정
            socket.emit('join-room', roomId);
            
            document.getElementById('status').textContent = `🏠 방 "${roomId}"에 입장함`;
            document.getElementById('status').style.background = '#17a2b8';
        }

        // 사용자 설정
        function setUser() {
            const userId = document.getElementById('user-id').value.trim();
            if (!userId) {
                alert('사용자 ID를 입력해주세요.');
                return;
            }
            
            currentUserId = userId;
            window.currentUserId = userId; // 전역 변수로도 설정
            socket.emit('set-user', userId);
            
            document.getElementById('status').textContent = `👤 사용자 "${userId}"로 설정됨`;
        }

        // AdvancedHtmlDemo 클래스 (위에서 정의한 클래스)
        class AdvancedHtmlDemo {
            constructor(socket, containerId) {
                this.socket = socket;
                this.container = document.getElementById(containerId);
                this.isGenerating = false;
                
                this.setupEvents();
                this.createUI();
            }
            
            setupEvents() {
                this.socket.on('html-demo-progress', (progress) => {
                    this.updateProgress(progress);
                });
                
                this.socket.on('html-demo-complete', (result) => {
                    this.showResult(result);
                    this.isGenerating = false;
                });
                
                this.socket.on('html-demo-error', (error) => {
                    this.showError(error);
                    this.isGenerating = false;
                });
            }
            
            createUI() {
                this.container.innerHTML = \`
                    <div class="html-demo-widget">
                        <h3>🎨 HTML 데모 생성</h3>
                        
                        <div class="input-section">
                            <input type="url" id="image-url" placeholder="이미지 URL (선택사항)">
                            <input type="url" id="prd-url" placeholder="PRD URL (선택사항)">
                            <input type="url" id="html-url" placeholder="HTML 템플릿 URL (선택사항)">
                            <button id="generate-btn">🚀 생성하기</button>
                        </div>
                        
                        <div id="progress-section" style="display: none;">
                            <div class="progress-bar">
                                <div id="progress-fill"></div>
                            </div>
                            <div id="progress-text">준비 중...</div>
                        </div>
                        
                        <div id="result-section" style="display: none;"></div>
                    </div>
                \`;
                
                // 이벤트 리스너 등록
                this.container.querySelector('#generate-btn').addEventListener('click', () => {
                    this.startGeneration();
                });
            }
            
            startGeneration() {
                if (this.isGenerating) return;
                
                const imageUrl = this.container.querySelector('#image-url').value;
                const prdUrl = this.container.querySelector('#prd-url').value;
                const htmlUrl = this.container.querySelector('#html-url').value;
                
                if (!window.currentRoomId || !window.currentUserId) {
                    alert('방에 입장하고 사용자를 설정해주세요.');
                    return;
                }
                
                this.isGenerating = true;
                this.showProgress();
                
                this.socket.emit('generate-html-demo', {
                    roomId: window.currentRoomId,
                    userId: window.currentUserId,
                    imageUrl: imageUrl || null,
                    prdUrl: prdUrl || null,
                    htmlUrl: htmlUrl || null
                });
            }
            
            showProgress() {
                this.container.querySelector('#progress-section').style.display = 'block';
                this.container.querySelector('#result-section').style.display = 'none';
                this.container.querySelector('#generate-btn').disabled = true;
            }
            
            updateProgress(progress) {
                const progressMap = {
                    'summary': { percent: 33, text: '채팅 요약 생성 중...' },
                    'fastapi': { percent: 66, text: 'AI가 PRD와 HTML 생성 중...' },
                    'upload': { percent: 90, text: '파일 업로드 중...' }
                };
                
                const info = progressMap[progress.step];
                if (info) {
                    this.container.querySelector('#progress-fill').style.width = \`\${info.percent}%\`;
                    this.container.querySelector('#progress-text').textContent = progress.message;
                }
            }
            
            showResult(result) {
                this.container.querySelector('#progress-section').style.display = 'none';
                this.container.querySelector('#generate-btn').disabled = false;
                
                const resultSection = this.container.querySelector('#result-section');
                resultSection.innerHTML = \`
                    <div class="success-result">
                        <h4>✅ \${result.message}</h4>
                        <div class="file-links">
                            <a href="\${result.prdFile}" target="_blank" class="file-link prd">
                                📄 PRD 파일 보기
                            </a>
                            <a href="\${result.htmlFile}" target="_blank" class="file-link html">
                                🌐 HTML 데모 보기
                            </a>
                        </div>
                    </div>
                \`;
                resultSection.style.display = 'block';
            }
            
            showError(error) {
                this.container.querySelector('#progress-section').style.display = 'none';
                this.container.querySelector('#generate-btn').disabled = false;
                
                const resultSection = this.container.querySelector('#result-section');
                resultSection.innerHTML = \`
                    <div class="error-result">
                        <h4>❌ 생성 실패</h4>
                        <p>\${error.error}</p>
                        <button onclick="this.parentElement.parentElement.style.display='none'">
                            닫기
                        </button>
                    </div>
                \`;
                resultSection.style.display = 'block';
            }
        }

        // 페이지 로드 시 초기화
        document.addEventListener('DOMContentLoaded', () => {
            initSocket();
        });
    </script>
</body>
</html>
```

## 🔧 고급 사용법

### 1. 진행 상황 커스터마이징

```javascript
class CustomProgressDemo extends AdvancedHtmlDemo {
    updateProgress(progress) {
        // 커스텀 진행 상황 표시
        const steps = ['summary', 'fastapi', 'upload'];
        const currentIndex = steps.indexOf(progress.step);
        
        // 단계별 아이콘 업데이트
        steps.forEach((step, index) => {
            const element = document.getElementById(\`step-\${step}\`);
            if (element) {
                if (index < currentIndex) {
                    element.className = 'step completed';
                } else if (index === currentIndex) {
                    element.className = 'step active';
                } else {
                    element.className = 'step pending';
                }
            }
        });
        
        // 진행률 계산
        const percent = ((currentIndex + 1) / steps.length) * 100;
        this.container.querySelector('#progress-fill').style.width = \`\${percent}%\`;
        this.container.querySelector('#progress-text').textContent = progress.message;
    }
}
```

### 2. 에러 처리 강화

```javascript
class RobustHtmlDemo extends AdvancedHtmlDemo {
    constructor(socket, containerId) {
        super(socket, containerId);
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    showError(error) {
        console.error('HTML Demo Error:', error);
        
        // 재시도 가능한 에러인지 확인
        const retryableErrors = [
            'FastAPI 호출 실패',
            'Network error',
            'Timeout'
        ];
        
        const isRetryable = retryableErrors.some(err => 
            error.error.includes(err)
        );
        
        if (isRetryable && this.retryCount < this.maxRetries) {
            this.showRetryOption(error);
        } else {
            super.showError(error);
            this.retryCount = 0; // 재시도 카운트 리셋
        }
    }
    
    showRetryOption(error) {
        const resultSection = this.container.querySelector('#result-section');
        resultSection.innerHTML = \`
            <div class="error-result">
                <h4>⚠️ 일시적 오류 발생</h4>
                <p>\${error.error}</p>
                <p>재시도 \${this.retryCount + 1}/\${this.maxRetries}</p>
                <div style="margin-top: 15px;">
                    <button onclick="this.retry()" class="retry-btn">
                        🔄 다시 시도
                    </button>
                    <button onclick="this.cancel()" class="cancel-btn">
                        ❌ 취소
                    </button>
                </div>
            </div>
        \`;
        resultSection.style.display = 'block';
    }
    
    retry() {
        this.retryCount++;
        this.startGeneration();
    }
    
    cancel() {
        this.retryCount = 0;
        this.container.querySelector('#result-section').style.display = 'none';
        this.container.querySelector('#generate-btn').disabled = false;
    }
}
```

### 3. 파일 미리보기 기능

```javascript
class PreviewHtmlDemo extends AdvancedHtmlDemo {
    showResult(result) {
        super.showResult(result);
        
        // 미리보기 버튼 추가
        const resultSection = this.container.querySelector('#result-section');
        const previewBtn = document.createElement('button');
        previewBtn.textContent = '👁️ 미리보기';
        previewBtn.className = 'preview-btn';
        previewBtn.onclick = () => this.showPreview(result.htmlFile);
        
        resultSection.querySelector('.file-links').appendChild(previewBtn);
    }
    
    showPreview(htmlUrl) {
        // 모달 창으로 HTML 미리보기
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = \`
            <div class="preview-content">
                <div class="preview-header">
                    <h3>HTML 미리보기</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()">
                        ✕
                    </button>
                </div>
                <iframe src="\${htmlUrl}" class="preview-iframe"></iframe>
            </div>
        \`;
        
        document.body.appendChild(modal);
    }
}
```

## 📊 사용 통계 및 모니터링

```javascript
class AnalyticsHtmlDemo extends AdvancedHtmlDemo {
    constructor(socket, containerId) {
        super(socket, containerId);
        this.analytics = {
            generationCount: 0,
            successCount: 0,
            errorCount: 0,
            averageTime: 0,
            startTime: null
        };
    }
    
    startGeneration() {
        this.analytics.startTime = Date.now();
        this.analytics.generationCount++;
        super.startGeneration();
    }
    
    showResult(result) {
        const duration = Date.now() - this.analytics.startTime;
        this.analytics.successCount++;
        this.updateAverageTime(duration);
        
        super.showResult(result);
        this.logAnalytics('success', { duration });
    }
    
    showError(error) {
        const duration = Date.now() - this.analytics.startTime;
        this.analytics.errorCount++;
        
        super.showError(error);
        this.logAnalytics('error', { duration, error: error.error });
    }
    
    updateAverageTime(duration) {
        const total = this.analytics.averageTime * (this.analytics.successCount - 1) + duration;
        this.analytics.averageTime = total / this.analytics.successCount;
    }
    
    logAnalytics(event, data) {
        console.log('HTML Demo Analytics:', {
            event,
            timestamp: new Date().toISOString(),
            analytics: this.analytics,
            data
        });
        
        // 외부 분석 서비스로 전송 (예: Google Analytics, Mixpanel 등)
        if (window.gtag) {
            window.gtag('event', 'html_demo_' + event, {
                duration: data.duration,
                success_rate: this.analytics.successCount / this.analytics.generationCount
            });
        }
    }
    
    getStats() {
        return {
            ...this.analytics,
            successRate: this.analytics.successCount / this.analytics.generationCount,
            errorRate: this.analytics.errorCount / this.analytics.generationCount
        };
    }
}
```

## 🚨 주의사항

### 보안
- URL 입력 시 XSS 공격 방지를 위해 입력값 검증 필요
- 생성된 파일의 S3 URL은 임시 URL이므로 영구 저장 시 별도 처리 필요

### 성능
- 대용량 파일 처리 시 타임아웃 설정 조정 필요
- 동시 생성 요청 제한 권장 (클라이언트 측에서 중복 요청 방지)

### 사용자 경험
- 진행 상황 표시로 사용자 대기 시간 체감 단축
- 에러 발생 시 명확한 안내 메시지 제공
- 모바일 환경에서의 반응형 디자인 고려

---

이 가이드를 통해 HTML 데모 생성 기능을 완벽하게 구현할 수 있습니다! 🎨✨
```
