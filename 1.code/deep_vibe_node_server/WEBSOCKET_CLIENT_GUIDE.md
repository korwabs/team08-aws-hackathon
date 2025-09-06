# WebSocket 클라이언트 가이드

실시간 채팅 및 음성인식 기능을 위한 WebSocket 클라이언트 구현 가이드입니다.

## 🚀 빠른 시작

### 1. Socket.IO 클라이언트 설정

```html
<!-- CDN 방식 -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

<!-- 또는 npm 설치 -->
<!-- npm install socket.io-client -->
```

```javascript
// WebSocket 연결
const socket = io();

// 연결 확인
socket.on('connect', () => {
    console.log('서버에 연결되었습니다:', socket.id);
});
```

## 📋 기본 사용 흐름

### 1단계: 채팅방 입장
```javascript
// 방 입장
const roomId = 'your-room-id';
socket.emit('join-room', roomId);
```

### 2단계: 사용자 설정
```javascript
// 사용자 ID 설정
const userId = 'user123';
socket.emit('set-user', userId);
```

### 3단계: 메시지 수신 리스너 등록
```javascript
// 새 메시지 수신
socket.on('new-message', (message) => {
    console.log('새 메시지:', message);
    // UI에 메시지 표시
    displayMessage(message);
});
```

## 💬 채팅 메시지

### 텍스트 메시지 전송
```javascript
function sendMessage(text) {
    const messageData = {
        roomId: currentRoomId,
        userId: currentUserId,
        message: text
    };
    
    socket.emit('chat-message', messageData);
}
```

### 메시지 수신 처리
```javascript
socket.on('new-message', (message) => {
    /*
    message 구조:
    {
        id: 123,
        room_id: "room-uuid",
        user_id: "user123",
        message: "메시지 내용",
        message_type: "text" | "transcribe",
        created_at: "2025-09-05T14:30:00.000Z"
    }
    */
    
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `
        <strong>${message.user_id}:</strong> 
        ${message.message}
        <small>(${message.message_type})</small>
    `;
    chatContainer.appendChild(messageElement);
});
```

## 🎤 음성인식 기능

### 음성인식 시작

```javascript
async function startVoiceRecognition() {
    try {
        // 1. 마이크 권한 요청
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { 
                sampleRate: 16000, 
                channelCount: 1 
            }
        });
        
        // 2. 오디오 컨텍스트 설정
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        // 3. 실시간 오디오 데이터 처리
        processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            
            // Float32Array를 16-bit PCM으로 변환
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }
            
            // 서버로 오디오 데이터 전송
            socket.emit('audio-data', pcmData.buffer);
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        // 4. 서버에 음성인식 시작 요청
        socket.emit('start-transcribe', { 
            languageCode: 'ko-KR'  // 한국어
        });
        
        // 전역 변수에 저장 (중지 시 사용)
        window.audioStream = stream;
        window.audioContext = audioContext;
        window.processor = processor;
        
    } catch (error) {
        console.error('마이크 접근 실패:', error);
        alert('마이크 권한이 필요합니다.');
    }
}
```

### 음성인식 중지

```javascript
function stopVoiceRecognition() {
    // 1. 오디오 스트림 중지
    if (window.audioStream) {
        window.audioStream.getTracks().forEach(track => track.stop());
    }
    
    // 2. 오디오 컨텍스트 종료
    if (window.audioContext) {
        window.audioContext.close();
    }
    
    // 3. 서버에 중지 요청
    socket.emit('stop-transcribe');
    
    // 4. 전역 변수 정리
    window.audioStream = null;
    window.audioContext = null;
    window.processor = null;
}
```

### 음성인식 이벤트 처리

```javascript
// 음성인식 시작 확인
socket.on('transcribe-started', (result) => {
    console.log('음성인식 시작됨:', result);
    showStatus('🎤 음성인식 중...');
});

// 실시간 전사 결과
socket.on('transcribe-result', (result) => {
    /*
    result 구조:
    {
        transcript: "인식된 텍스트",
        isPartial: true/false,  // 중간결과/최종결과
        confidence: 0.95        // 신뢰도 (0-1)
    }
    */
    
    console.log('전사 결과:', result);
    
    // 실시간 결과 표시
    document.getElementById('transcribe-text').textContent = result.transcript;
    
    if (!result.isPartial) {
        console.log('최종 결과 - 채팅 메시지로 자동 저장됨');
    }
});

// 음성인식 중지 확인
socket.on('transcribe-stopped', () => {
    console.log('음성인식 중지됨');
    showStatus('음성인식이 중지되었습니다.');
});

// 음성인식 에러
socket.on('transcribe-error', (error) => {
    console.error('음성인식 에러:', error);
    showStatus(`오류: ${error.error}`, 'error');
    
    // 에러 시 정리 작업
    stopVoiceRecognition();
});
```

## 🎨 HTML 데모 생성 기능

### HTML 데모 생성 요청

```javascript
function generateHtmlDemo(roomId, userId, options = {}) {
    const requestData = {
        roomId: roomId,
        userId: userId,
        imageUrl: options.imageUrl || null,
        prdUrl: options.prdUrl || null,
        htmlUrl: options.htmlUrl || null
    };
    
    console.log('HTML 데모 생성 요청:', requestData);
    socket.emit('generate-html-demo', requestData);
}

// 사용 예제
generateHtmlDemo('room-123', 'user-456', {
    imageUrl: 'https://example.com/image.jpg',
    prdUrl: 'https://example.com/prd.md'
});
```

### HTML 데모 생성 이벤트 처리

```javascript
// 진행 상황 업데이트
socket.on('html-demo-progress', (progress) => {
    /*
    progress 구조:
    {
        step: "summary" | "fastapi" | "upload",
        message: "진행 상황 메시지"
    }
    */
    
    console.log(`진행 상황 [${progress.step}]:`, progress.message);
    updateProgressUI(progress);
});

// 생성 완료
socket.on('html-demo-complete', (result) => {
    /*
    result 구조:
    {
        success: true,
        message: "성공 메시지",
        prdFile: "S3 PRD 파일 URL",
        htmlFile: "S3 HTML 파일 URL"
    }
    */
    
    console.log('HTML 데모 생성 완료:', result);
    showSuccessMessage(result.message);
    
    // 생성된 파일 링크 표시
    displayGeneratedFiles(result.prdFile, result.htmlFile);
});

// 생성 오류
socket.on('html-demo-error', (error) => {
    /*
    error 구조:
    {
        success: false,
        error: "오류 메시지"
    }
    */
    
    console.error('HTML 데모 생성 오류:', error);
    showErrorMessage(error.error);
});
```

### 완전한 HTML 데모 생성 클래스

```javascript
class HtmlDemoGenerator {
    constructor(socket) {
        this.socket = socket;
        this.isGenerating = false;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.socket.on('html-demo-progress', (progress) => {
            this.onProgress(progress);
        });
        
        this.socket.on('html-demo-complete', (result) => {
            this.onComplete(result);
        });
        
        this.socket.on('html-demo-error', (error) => {
            this.onError(error);
        });
    }
    
    async generateDemo(roomId, userId, options = {}) {
        if (this.isGenerating) {
            throw new Error('이미 HTML 데모를 생성 중입니다.');
        }
        
        this.isGenerating = true;
        this.showProgressModal();
        
        try {
            const requestData = {
                roomId,
                userId,
                imageUrl: options.imageUrl || null,
                prdUrl: options.prdUrl || null,
                htmlUrl: options.htmlUrl || null
            };
            
            console.log('HTML 데모 생성 시작:', requestData);
            this.socket.emit('generate-html-demo', requestData);
            
        } catch (error) {
            this.isGenerating = false;
            this.hideProgressModal();
            throw error;
        }
    }
    
    onProgress(progress) {
        console.log(`[${progress.step}] ${progress.message}`);
        this.updateProgressStep(progress.step, progress.message);
    }
    
    onComplete(result) {
        console.log('HTML 데모 생성 완료:', result);
        this.isGenerating = false;
        this.hideProgressModal();
        this.showSuccessResult(result);
    }
    
    onError(error) {
        console.error('HTML 데모 생성 실패:', error);
        this.isGenerating = false;
        this.hideProgressModal();
        this.showErrorResult(error);
    }
    
    // UI 업데이트 메서드들
    showProgressModal() {
        const modal = document.getElementById('demo-progress-modal');
        if (modal) {
            modal.style.display = 'block';
            this.resetProgressSteps();
        }
    }
    
    hideProgressModal() {
        const modal = document.getElementById('demo-progress-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    updateProgressStep(step, message) {
        const stepElements = {
            'summary': document.getElementById('step-summary'),
            'fastapi': document.getElementById('step-fastapi'),
            'upload': document.getElementById('step-upload')
        };
        
        // 모든 단계를 대기 상태로 리셋
        Object.values(stepElements).forEach(el => {
            if (el) {
                el.className = 'progress-step waiting';
            }
        });
        
        // 현재 단계를 활성화
        if (stepElements[step]) {
            stepElements[step].className = 'progress-step active';
            stepElements[step].querySelector('.step-message').textContent = message;
        }
    }
    
    resetProgressSteps() {
        const steps = ['summary', 'fastapi', 'upload'];
        steps.forEach(step => {
            const element = document.getElementById(`step-${step}`);
            if (element) {
                element.className = 'progress-step waiting';
                element.querySelector('.step-message').textContent = '대기 중...';
            }
        });
    }
    
    showSuccessResult(result) {
        const resultDiv = document.getElementById('demo-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="success-message">
                    <h3>✅ ${result.message}</h3>
                    <div class="generated-files">
                        <div class="file-link">
                            <strong>PRD 파일:</strong>
                            <a href="${result.prdFile}" target="_blank">다운로드</a>
                        </div>
                        <div class="file-link">
                            <strong>HTML 파일:</strong>
                            <a href="${result.htmlFile}" target="_blank">미리보기</a>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    }
    
    showErrorResult(error) {
        const resultDiv = document.getElementById('demo-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error-message">
                    <h3>❌ 생성 실패</h3>
                    <p>${error.error}</p>
                    <button onclick="this.parentElement.parentElement.style.display='none'">
                        닫기
                    </button>
                </div>
            `;
            resultDiv.style.display = 'block';
        }
    }
}

// 사용 예제
const demoGenerator = new HtmlDemoGenerator(socket);

// HTML 데모 생성 버튼 클릭 시
document.getElementById('generate-demo-btn').addEventListener('click', async () => {
    try {
        await demoGenerator.generateDemo(
            currentRoomId, 
            currentUserId,
            {
                imageUrl: document.getElementById('image-url-input').value,
                prdUrl: document.getElementById('prd-url-input').value,
                htmlUrl: document.getElementById('html-url-input').value
            }
        );
    } catch (error) {
        alert(error.message);
    }
});
```

### HTML UI 예제

```html
<!-- HTML 데모 생성 UI -->
<div id="html-demo-section">
    <h3>🎨 HTML 데모 생성</h3>
    
    <!-- 입력 폼 -->
    <div class="demo-inputs">
        <div class="input-group">
            <label>이미지 URL (선택사항):</label>
            <input type="url" id="image-url-input" placeholder="https://example.com/image.jpg">
        </div>
        
        <div class="input-group">
            <label>PRD URL (선택사항):</label>
            <input type="url" id="prd-url-input" placeholder="https://example.com/prd.md">
        </div>
        
        <div class="input-group">
            <label>HTML URL (선택사항):</label>
            <input type="url" id="html-url-input" placeholder="https://example.com/template.html">
        </div>
        
        <button id="generate-demo-btn" class="demo-btn">
            🚀 HTML 데모 생성
        </button>
    </div>
    
    <!-- 진행 상황 모달 -->
    <div id="demo-progress-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>HTML 데모 생성 중...</h3>
            
            <div class="progress-steps">
                <div id="step-summary" class="progress-step waiting">
                    <div class="step-icon">📝</div>
                    <div class="step-info">
                        <div class="step-title">채팅 요약</div>
                        <div class="step-message">대기 중...</div>
                    </div>
                </div>
                
                <div id="step-fastapi" class="progress-step waiting">
                    <div class="step-icon">🤖</div>
                    <div class="step-info">
                        <div class="step-title">AI 생성</div>
                        <div class="step-message">대기 중...</div>
                    </div>
                </div>
                
                <div id="step-upload" class="progress-step waiting">
                    <div class="step-icon">☁️</div>
                    <div class="step-info">
                        <div class="step-title">파일 업로드</div>
                        <div class="step-message">대기 중...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 결과 표시 -->
    <div id="demo-result" style="display: none;"></div>
</div>

<style>
.demo-inputs {
    margin: 20px 0;
}

.input-group {
    margin-bottom: 15px;
}

.input-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.input-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.demo-btn {
    background: linear-gradient(45deg, #007bff, #0056b3);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
}

.demo-btn:hover {
    background: linear-gradient(45deg, #0056b3, #004085);
}

.demo-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    max-width: 500px;
    width: 90%;
}

.progress-steps {
    margin-top: 20px;
}

.progress-step {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.progress-step.waiting {
    background: #f8f9fa;
    color: #6c757d;
}

.progress-step.active {
    background: #e3f2fd;
    color: #1976d2;
    border-left: 4px solid #2196f3;
}

.progress-step.completed {
    background: #e8f5e8;
    color: #2e7d32;
    border-left: 4px solid #4caf50;
}

.step-icon {
    font-size: 24px;
    margin-right: 15px;
}

.step-info {
    flex: 1;
}

.step-title {
    font-weight: bold;
    margin-bottom: 5px;
}

.step-message {
    font-size: 14px;
    opacity: 0.8;
}

.success-message {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

.error-message {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
}

.generated-files {
    margin-top: 15px;
}

.file-link {
    margin-bottom: 10px;
}

.file-link a {
    color: #007bff;
    text-decoration: none;
    margin-left: 10px;
}

.file-link a:hover {
    text-decoration: underline;
}
</style>
```

```javascript
class ChatClient {
    constructor() {
        this.socket = io();
        this.currentRoomId = null;
        this.currentUserId = null;
        this.isRecording = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 연결 이벤트
        this.socket.on('connect', () => {
            console.log('서버 연결됨:', this.socket.id);
        });
        
        // 메시지 수신
        this.socket.on('new-message', (message) => {
            this.displayMessage(message);
        });
        
        // 음성인식 이벤트들
        this.socket.on('transcribe-started', (result) => {
            this.onTranscribeStarted(result);
        });
        
        this.socket.on('transcribe-result', (result) => {
            this.onTranscribeResult(result);
        });
        
        this.socket.on('transcribe-stopped', () => {
            this.onTranscribeStopped();
        });
        
        this.socket.on('transcribe-error', (error) => {
            this.onTranscribeError(error);
        });
    }
    
    // 방 입장
    joinRoom(roomId) {
        this.currentRoomId = roomId;
        this.socket.emit('join-room', roomId);
        console.log(`방 입장: ${roomId}`);
    }
    
    // 사용자 설정
    setUser(userId) {
        this.currentUserId = userId;
        this.socket.emit('set-user', userId);
        console.log(`사용자 설정: ${userId}`);
    }
    
    // 메시지 전송
    sendMessage(text) {
        if (!this.currentRoomId || !this.currentUserId) {
            alert('방에 입장하고 사용자를 설정해주세요.');
            return;
        }
        
        this.socket.emit('chat-message', {
            roomId: this.currentRoomId,
            userId: this.currentUserId,
            message: text
        });
    }
    
    // 음성인식 토글
    toggleVoiceRecognition() {
        if (this.isRecording) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }
    
    async startVoiceRecognition() {
        if (!this.currentRoomId) {
            alert('방에 먼저 입장해주세요.');
            return;
        }
        
        try {
            // 마이크 설정 및 오디오 처리 로직
            // (위의 startVoiceRecognition 함수 내용과 동일)
            
            this.isRecording = true;
            
        } catch (error) {
            console.error('음성인식 시작 실패:', error);
        }
    }
    
    stopVoiceRecognition() {
        // 음성인식 중지 로직
        // (위의 stopVoiceRecognition 함수 내용과 동일)
        
        this.isRecording = false;
    }
    
    // UI 업데이트 메서드들
    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.message_type}`;
        messageElement.innerHTML = `
            <div class="message-header">
                <strong>${message.user_id}</strong>
                <span class="timestamp">${new Date(message.created_at).toLocaleTimeString()}</span>
                <span class="type">${message.message_type}</span>
            </div>
            <div class="message-content">${message.message}</div>
        `;
        
        document.getElementById('chat-container').appendChild(messageElement);
        
        // 스크롤을 맨 아래로
        messageElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    onTranscribeStarted(result) {
        document.getElementById('status').textContent = '🎤 음성인식 중...';
        document.getElementById('record-btn').textContent = '🛑 중지';
    }
    
    onTranscribeResult(result) {
        document.getElementById('transcribe-text').textContent = result.transcript;
        
        if (!result.isPartial) {
            // 최종 결과는 자동으로 채팅 메시지가 됨
            setTimeout(() => {
                document.getElementById('transcribe-text').textContent = '';
            }, 2000);
        }
    }
    
    onTranscribeStopped() {
        document.getElementById('status').textContent = '음성인식이 중지되었습니다.';
        document.getElementById('record-btn').textContent = '🎤 시작';
        document.getElementById('transcribe-text').textContent = '';
    }
    
    onTranscribeError(error) {
        document.getElementById('status').textContent = `오류: ${error.error}`;
        this.stopVoiceRecognition();
    }
}

// 사용 예제
const chatClient = new ChatClient();

// 방 입장
chatClient.joinRoom('room-123');

// 사용자 설정
chatClient.setUser('user-456');

// 메시지 전송
chatClient.sendMessage('안녕하세요!');

// 음성인식 시작/중지
chatClient.toggleVoiceRecognition();
```

## 📱 HTML 예제

```html
<!DOCTYPE html>
<html>
<head>
    <title>실시간 채팅 & 음성인식</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="app">
        <!-- 방 입장 -->
        <div>
            <input type="text" id="room-id" placeholder="방 ID">
            <button onclick="joinRoom()">방 입장</button>
        </div>
        
        <!-- 사용자 설정 -->
        <div>
            <input type="text" id="user-id" placeholder="사용자 ID">
            <button onclick="setUser()">사용자 설정</button>
        </div>
        
        <!-- 채팅 -->
        <div id="chat-container" style="height: 300px; overflow-y: auto; border: 1px solid #ccc;"></div>
        
        <!-- 메시지 입력 -->
        <div>
            <input type="text" id="message-input" placeholder="메시지 입력">
            <button onclick="sendMessage()">전송</button>
        </div>
        
        <!-- 음성인식 -->
        <div>
            <button id="record-btn" onclick="toggleRecording()">🎤 음성인식 시작</button>
            <div id="transcribe-text" style="font-style: italic; color: #666;"></div>
        </div>
        
        <!-- 상태 표시 -->
        <div id="status"></div>
    </div>

    <script>
        // 위의 ChatClient 클래스 코드 포함
        
        const chatClient = new ChatClient();
        
        function joinRoom() {
            const roomId = document.getElementById('room-id').value;
            if (roomId) {
                chatClient.joinRoom(roomId);
            }
        }
        
        function setUser() {
            const userId = document.getElementById('user-id').value;
            if (userId) {
                chatClient.setUser(userId);
            }
        }
        
        function sendMessage() {
            const input = document.getElementById('message-input');
            if (input.value.trim()) {
                chatClient.sendMessage(input.value);
                input.value = '';
            }
        }
        
        function toggleRecording() {
            chatClient.toggleVoiceRecognition();
        }
        
        // Enter 키로 메시지 전송
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## ⚠️ 주의사항

### 브라우저 호환성
- **WebRTC**: Chrome, Firefox, Safari 최신 버전
- **AudioContext**: 모든 모던 브라우저 지원
- **getUserMedia**: HTTPS 환경에서만 동작

### 권한 요청
```javascript
// 마이크 권한 확인
navigator.permissions.query({ name: 'microphone' }).then((result) => {
    if (result.state === 'granted') {
        console.log('마이크 권한 허용됨');
    } else if (result.state === 'prompt') {
        console.log('마이크 권한 요청 필요');
    } else {
        console.log('마이크 권한 거부됨');
    }
});
```

### 에러 처리
```javascript
// 연결 에러
socket.on('connect_error', (error) => {
    console.error('연결 실패:', error);
    alert('서버에 연결할 수 없습니다.');
});

// 연결 해제
socket.on('disconnect', (reason) => {
    console.log('연결 해제:', reason);
    if (reason === 'io server disconnect') {
        // 서버에서 연결을 끊음 - 재연결 시도
        socket.connect();
    }
});
```

## 🔧 디버깅

### 브라우저 콘솔에서 확인
```javascript
// WebSocket 연결 상태
console.log('연결됨:', socket.connected);
console.log('Socket ID:', socket.id);

// 현재 방 정보
console.log('현재 방:', chatClient.currentRoomId);
console.log('현재 사용자:', chatClient.currentUserId);

// 음성인식 상태
console.log('녹음 중:', chatClient.isRecording);
```

### 네트워크 탭에서 WebSocket 확인
1. F12 → Network 탭
2. WS 필터 선택
3. WebSocket 연결 및 메시지 확인

## 📚 추가 리소스

- [Socket.IO 클라이언트 문서](https://socket.io/docs/v4/client-api/)
- [Web Audio API 가이드](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

이 가이드를 따라하면 실시간 채팅과 음성인식 기능을 완벽하게 구현할 수 있습니다! 🚀
