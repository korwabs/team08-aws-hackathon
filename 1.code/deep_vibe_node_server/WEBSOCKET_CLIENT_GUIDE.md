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

## 🔄 전체 워크플로우 예제

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
