FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# TypeScript 컴파일러 설치 (빌드용)
RUN npm install -g typescript

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
