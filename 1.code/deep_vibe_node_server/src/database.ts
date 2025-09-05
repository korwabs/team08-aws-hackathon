import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  charset: string;
}

const dbConfig: DatabaseConfig = {
  host: (process.env.DB_HOST || 'localhost').split(':')[0], // Remove port from host
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// 테이블 초기화
async function initializeDatabase(): Promise<void> {
  try {
    // 채팅방 테이블
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        participants INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 채팅 메시지 테이블
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES chat_rooms (id)
      )
    `);

    // HTML 파일 버전 관리 테이블
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS html_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(36) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_url VARCHAR(1000) NOT NULL,
        version INT NOT NULL DEFAULT 1,
        file_size INT NOT NULL,
        uploaded_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES chat_rooms (id),
        UNIQUE KEY unique_room_version (room_id, version)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 데이터베이스 초기화 실행
initializeDatabase();

export default pool;
