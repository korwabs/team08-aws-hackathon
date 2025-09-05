-- UTF-8 문자셋 설정
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터
INSERT INTO chat_rooms (id, name) VALUES 
('sample-room-1', '일반 채팅방'),
('sample-room-2', '개발팀 채팅방');

INSERT INTO messages (room_id, user_id, message, message_type) VALUES 
('sample-room-1', 'admin', '채팅방에 오신 것을 환영합니다!', 'text'),
('sample-room-2', 'developer', '개발팀 채팅방입니다.', 'text');
