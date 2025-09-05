const socket = io();
let currentRoomId = null;
let isRecording = false;
let mediaRecorder = null;
let audioStream = null;
let audioContext = null;
let analyser = null;
let animationId = null;

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
    if (!roomName) {
        alert('채팅방 이름을 입력하세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName })
        });
        
        const room = await response.json();
        document.getElementById('roomName').value = '';
        loadRooms();
        showStatus(`채팅방 "${room.name}"이 생성되었습니다.`);
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
        const messages = await response.json();
        
        chatContainer.innerHTML = '';
        messages.forEach(message => displayMessage(message));
        
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

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.message_type}`;
    
    const time = new Date(message.created_at).toLocaleTimeString();
    const typeIcon = message.message_type === 'transcribe' ? '🎤' : '💬';
    
    messageDiv.innerHTML = `
        <div class="user">${typeIcon} ${message.user_id}</div>
        <div>${message.message}</div>
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
