# 双人贪吃蛇游戏

一个基于HTML5 Canvas的双人贪吃蛇游戏，支持键盘控制和触摸屏控制。

## 功能特点

- 双人同时游戏
- 支持键盘控制（方向键和WASD）
- 支持移动端触摸控制
- 响应式设计
- 音效系统
- 排行榜系统
- 特殊食物系统

## 本地运行

1. 确保已安装 Node.js（建议版本 14.0.0 或更高）
2. 克隆项目到本地
3. 进入项目目录
4. 安装依赖：
   ```bash
   npm install
   ```
5. 启动开发服务器：
   ```bash
   npm run dev
   ```
6. 在浏览器中访问 `http://localhost:3000`

## 部署到公网

### 使用 Heroku 部署

1. 注册 Heroku 账号并安装 Heroku CLI
2. 登录 Heroku：
   ```bash
   heroku login
   ```
3. 创建新的 Heroku 应用：
   ```bash
   heroku create your-app-name
   ```
4. 部署应用：
   ```bash
   git push heroku main
   ```

### 使用 Vercel 部署

1. 注册 Vercel 账号
2. 安装 Vercel CLI：
   ```bash
   npm install -g vercel
   ```
3. 部署应用：
   ```bash
   vercel
   ```

### 使用传统服务器部署

1. 将项目文件上传到服务器
2. 安装 Node.js 和 npm
3. 安装依赖：
   ```bash
   npm install
   ```
4. 使用 PM2 启动应用：
   ```bash
   npm install -g pm2
   pm2 start server.js
   ```

## 游戏控制

### 玩家1（绿色蛇）
- 使用方向键控制
- 移动端使用屏幕左侧按钮

### 玩家2（红色蛇）
- 使用WASD键控制
- 移动端使用屏幕右侧按钮

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- Node.js
- Express
- Canvas API

## 许可证

MIT License 