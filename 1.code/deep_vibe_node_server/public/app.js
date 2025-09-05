const socket = io();
let currentRoomId = null;
let isRecording = false;
let mediaRecorder = null;
let audioStream = null;
let audioContext = null;
let analyser = null;
let animationId = null;
let isSidebarOpen = false;

// DOM 요소
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const roomSelect = document.getElementById('roomSelect');
const recordBtn = document.getElementById('recordBtn');
const transcribeStatus = document.getElementById('transcribeStatus');
const transcribeResult = document.getElementById('transcribeResult');
const transcribeText = document.getElementById('transcribeText');
const status = document.getElementById('status');
const visualizerContainer = document.querySelector('.visualizer-container');
const canvas = document.getElementById('audioVisualizer');
const canvasCtx = canvas.getContext('2d');
const mainContainer = document.getElementById('mainContainer');
const summarySidebar = document.getElementById('summarySidebar');
const sidebarContent = document.getElementById('sidebarContent');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadRooms();
    setUser();
    setupCanvas();
});

function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = 100;
}

// 요약 사이드바 관련 함수들
function toggleSummary() {
    if (!currentRoomId) {
        alert('먼저 채팅방에 입장해주세요.');
        return;
    }
    
    if (isSidebarOpen) {
        closeSummary();
    } else {
        openSummary();
    }
}

function openSummary() {
    isSidebarOpen = true;
    summarySidebar.classList.add('open');
    mainContainer.classList.add('sidebar-open');
    loadSummary();
}

function closeSummary() {
    isSidebarOpen = false;
    summarySidebar.classList.remove('open');
    mainContainer.classList.remove('sidebar-open');
}

async function loadSummary() {
    if (!currentRoomId) return;
    
    // 로딩 상태 표시
    sidebarContent.innerHTML = `
        <div class="summary-loading">
            <p>📊 대화를 분석하고 있습니다...</p>
            <div style="margin: 20px 0;">
                <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #4facfe, #00f2fe); animation: loading 2s infinite;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        </style>
    `;
    
    try {
        const response = await fetch(`/api/rooms/${currentRoomId}/summary`);
        const data = await response.json();
        
        if (response.ok) {
            displaySummary(data);
        } else {
            throw new Error(data.error || '요약을 가져오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('Summary error:', error);
        sidebarContent.innerHTML = `
            <div class="summary-loading">
                <p style="color: #f44336;">❌ 요약을 가져오는데 실패했습니다.</p>
                <p style="font-size: 14px; color: #666;">${error.message}</p>
                <button class="btn btn-primary" onclick="loadSummary()" style="margin-top: 15px;">다시 시도</button>
            </div>
        `;
    }
}

function displaySummary(data) {
    const { summary, messageCount, imageCount } = data;
    
    // 마크다운을 HTML로 변환
    const htmlContent = marked.parse(summary);
    
    sidebarContent.innerHTML = `
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-number">${messageCount}</div>
                <div class="stat-label">메시지</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${imageCount}</div>
                <div class="stat-label">이미지</div>
            </div>
        </div>
        <div class="summary-text">
            ${htmlContent}
        </div>
    `;
}

// Socket 이벤트 리스너
socket.on('new-message', (message) => {
    displayMessage(message);
});

socket.on('transcribe-started', (result) => {
    showStatus('음성인식이 시작되었습니다.', 'transcribing');
    transcribeStatus.innerHTML = '<span style="color: #4caf50;">🎤 인식 중...</span>';
});

socket.on('transcribe-result', (result) => {
    transcribeText.textContent = result.transcript;
    transcribeResult.style.display = 'block';
    
    if (!result.isPartial) {
        setTimeout(() => {
            transcribeResult.style.display = 'none';
        }, 3000);
    }
});

socket.on('transcribe-stopped', () => {
    showStatus('음성인식이 중지되었습니다.', '');
    transcribeStatus.textContent = '';
    transcribeResult.style.display = 'none';
});

socket.on('transcribe-error', (error) => {
    showStatus(`음성인식 오류: ${error.error}`, 'error');
    transcribeStatus.innerHTML = '<span style="color: #f44336;">❌ 오류 발생</span>';
});

// 채팅방 관리
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        
        roomSelect.innerHTML = '<option value="">채팅방 선택</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load rooms:', error);
    }
}

async function createRoom() {
    const roomName = document.getElementById('roomName').value.trim();
    const participants = parseInt(document.getElementById('participants').value) || 1;
    
    if (!roomName) {
        alert('채팅방 이름을 입력하세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName, participants })
        });
        
        const room = await response.json();
        document.getElementById('roomName').value = '';
        document.getElementById('participants').value = '1';
        loadRooms();
        showStatus(`채팅방 "${room.name}" (${room.participants}명)이 생성되었습니다.`);
    } catch (error) {
        console.error('Failed to create room:', error);
    }
}

async function joinRoom() {
    const roomId = roomSelect.value;
    if (!roomId) {
        alert('채팅방을 선택하세요.');
        return;
    }
    
    currentRoomId = roomId;
    socket.emit('join-room', roomId);
    
    try {
        const response = await fetch(`/api/rooms/${roomId}/messages`);
        const data = await response.json();
        
        chatContainer.innerHTML = '';
        data.messages.forEach(message => displayMessage(message));
        
        // 이미지 URL 목록을 콘솔에 출력 (필요시 활용)
        console.log('Image URLs in this room:', data.imageUrls);
        
        showStatus(`채팅방에 입장했습니다.`);
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

function setUser() {
    const userId = document.getElementById('userId').value.trim();
    if (userId) {
        socket.emit('set-user', userId);
        showStatus(`사용자 "${userId}"로 설정되었습니다.`);
    }
}

// 메시지 관리
function sendMessage() {
    const message = messageInput.value.trim();
    const userId = document.getElementById('userId').value.trim();
    
    if (!message || !currentRoomId || !userId) {
        alert('메시지, 채팅방, 사용자 ID를 모두 입력하세요.');
        return;
    }
    
    socket.emit('chat-message', {
        roomId: currentRoomId,
        userId: userId,
        message: message
    });
    
    messageInput.value = '';
}

// HTML 파일 업로드 함수
async function uploadHtml() {
    const fileInput = document.getElementById('htmlInput');
    const userId = document.getElementById('userId').value.trim();
    
    if (!currentRoomId) {
        alert('먼저 채팅방에 입장해주세요.');
        return;
    }
    
    if (!userId) {
        alert('사용자 ID를 설정해주세요.');
        return;
    }
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('HTML 파일을 선택해주세요.');
        return;
    }
    
    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.html')) {
        alert('HTML 파일만 업로드 가능합니다.');
        return;
    }
    
    const formData = new FormData();
    formData.append('html', file);
    formData.append('userId', userId);
    
    try {
        const response = await fetch(`/api/rooms/${currentRoomId}/html`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`HTML 파일이 업로드되었습니다! (버전: ${result.version})`);
            fileInput.value = '';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('HTML upload error:', error);
        alert('HTML 파일 업로드에 실패했습니다: ' + error.message);
    }
}

// HTML 파일 목록 조회 함수
async function viewHtmlFiles() {
    if (!currentRoomId) {
        alert('먼저 채팅방에 입장해주세요.');
        return;
    }
    
    const modal = document.getElementById('htmlFilesModal');
    const filesList = document.getElementById('htmlFilesList');
    
    modal.style.display = 'flex';
    filesList.innerHTML = '<p>로딩 중...</p>';
    
    try {
        const response = await fetch(`/api/rooms/${currentRoomId}/html`);
        const htmlFiles = await response.json();
        
        if (response.ok) {
            if (htmlFiles.length === 0) {
                filesList.innerHTML = '<p>업로드된 HTML 파일이 없습니다.</p>';
            } else {
                filesList.innerHTML = htmlFiles.map(file => `
                    <div class="html-file-item">
                        <div class="html-file-info">
                            <div style="font-weight: bold;">${file.filename}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${new Date(file.created_at).toLocaleString()} | 
                                ${(file.file_size / 1024).toFixed(1)}KB | 
                                업로드: ${file.uploaded_by}
                            </div>
                        </div>
                        <div class="html-file-actions">
                            <span class="html-file-version">v${file.version}</span>
                            <button class="btn btn-primary" onclick="window.open('${file.s3_url}', '_blank')" style="padding: 5px 10px; font-size: 12px;">
                                🔗 열기
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            throw new Error(htmlFiles.error);
        }
    } catch (error) {
        console.error('HTML files fetch error:', error);
        filesList.innerHTML = `<p style="color: #f44336;">파일 목록을 가져오는데 실패했습니다: ${error.message}</p>`;
    }
}

// HTML 모달 닫기 함수
function closeHtmlModal() {
    document.getElementById('htmlFilesModal').style.display = 'none';
}

// 파일 업로드 함수
async function uploadImage() {
    const fileInput = document.getElementById('imageInput');
    const userId = document.getElementById('userId').value.trim();
    
    if (!fileInput.files[0]) {
        alert('이미지 파일을 선택하세요.');
        return;
    }
    
    if (!currentRoomId || !userId) {
        alert('채팅방에 입장하고 사용자 ID를 설정하세요.');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('roomId', currentRoomId);
    formData.append('userId', userId);
    
    try {
        showStatus('이미지 업로드 중...', 'uploading');
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        const result = await response.json();
        showStatus('이미지가 업로드되었습니다.', 'success');
        fileInput.value = ''; // 파일 입력 초기화
        
    } catch (error) {
        console.error('Upload error:', error);
        showStatus(`업로드 실패: ${error.message}`, 'error');
    }
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.message_type}`;
    
    const time = new Date(message.created_at).toLocaleTimeString();
    let typeIcon = '💬';
    let content = message.message;
    
    if (message.message_type === 'transcribe') {
        typeIcon = '🎤';
    } else if (message.message_type === 'image') {
        typeIcon = '🖼️';
        content = `<img src="${message.message}" alt="업로드된 이미지" style="max-width: 300px; max-height: 200px; border-radius: 8px;">`;
    }
    
    messageDiv.innerHTML = `
        <div class="user">${typeIcon} ${message.user_id}</div>
        <div>${content}</div>
        <div class="time">${time}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 오디오 시각화
function drawVisualizer() {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        const r = barHeight + 25 * (i / bufferLength);
        const g = 250 * (i / bufferLength);
        const b = 50;
        
        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
    
    animationId = requestAnimationFrame(drawVisualizer);
}

// 음성인식 관리
async function toggleRecording() {
    if (!currentRoomId) {
        alert('먼저 채팅방에 입장하세요.');
        return;
    }
    
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        // 오디오 시각화 설정
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);
        
        // PCM 오디오 처리를 위한 ScriptProcessorNode 사용
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        processor.onaudioprocess = (event) => {
            const inputBuffer = event.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            // Float32Array를 16-bit PCM으로 변환
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
            }
            
            // PCM 데이터를 서버로 전송
            socket.emit('audio-data', pcmData.buffer);
        };
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // 캔버스 크기 재설정
        setupCanvas();
        visualizerContainer.style.display = 'block';
        drawVisualizer();
        
        socket.emit('start-transcribe', { languageCode: 'ko-KR' });
        
        isRecording = true;
        recordBtn.textContent = '🛑 음성인식 중지';
        recordBtn.className = 'btn btn-danger recording';
        showStatus('음성을 녹음하고 있습니다.', 'recording');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        alert('마이크 접근 권한이 필요합니다.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContext) {
        audioContext.close();
    }
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    visualizerContainer.style.display = 'none';
    socket.emit('stop-transcribe');
    
    isRecording = false;
    recordBtn.textContent = '🎤 음성인식 시작';
    recordBtn.className = 'btn btn-success';
    showStatus('음성 녹음이 중지되었습니다.');
}

function showStatus(message, type = '') {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// 창 크기 변경 시 캔버스 크기 조정
window.addEventListener('resize', setupCanvas);
