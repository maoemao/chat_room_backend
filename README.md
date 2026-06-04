# 聊天室后端服务

基于 Node.js + TypeScript + Fastify + WebSocket + SQLite 的聊天室后端服务。

## 技术栈

- **语言**: TypeScript
- **框架**: Fastify
- **WebSocket**: ws
- **数据库**: SQLite3
- **认证**: JWT + bcryptjs
- **API文档**: Swagger

## 功能特性

### 用户认证
- ✅ 用户注册
- ✅ 用户登录（JWT认证）

### 房间管理
- ✅ 创建房间
- ✅ 获取所有房间列表
- ✅ 获取房间详情
- ✅ 加入房间
- ✅ 离开房间
- ✅ 获取房间用户列表

### 消息系统
- ✅ 发送消息
- ✅ 获取历史消息
- ✅ 实时消息广播

### WebSocket功能
- ✅ 用户认证
- ✅ 加入房间
- ✅ 离开房间
- ✅ 发送消息
- ✅ 心跳检测（ping/pong）

## 项目结构

```
chatroom_backend/
├── src/
│   ├── config/          # 配置文件
│   │   └── index.ts
│   ├── db/              # 数据库操作
│   │   └── index.ts
│   ├── http/            # HTTP路由
│   │   └── routes.ts
│   ├── services/        # 业务服务
│   │   ├── authService.ts
│   │   └── roomService.ts
│   ├── types/           # TypeScript类型
│   │   └── index.ts
│   ├── ws/              # WebSocket服务器
│   │   └── index.ts
│   └── index.ts         # 主入口
├── postman-collection.json  # Postman集合
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 安装与运行

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

### 服务端口

| 服务 | 端口 | 地址 |
|------|------|------|
| HTTP API | 3000 | http://localhost:3000 |
| WebSocket | 3001 | ws://localhost:3001 |
| Swagger文档 | 3000 | http://localhost:3000/docs |

## API文档

### Swagger UI
启动服务后访问：http://localhost:3000/docs

### Postman集合
导入 `postman-collection.json` 文件到Postman即可测试所有API。

## HTTP API接口

### 认证接口

#### 注册
```
POST /register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### 登录
```
POST /login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### 房间接口

#### 获取所有房间
```
GET /rooms
```

#### 创建房间
```
POST /rooms
Content-Type: application/json

{
  "name": "string",
  "description": "string (可选)",
  "token": "string"
}
```

#### 获取房间详情
```
GET /rooms/:roomId
```

#### 加入房间
```
POST /rooms/:roomId/join
Content-Type: application/json

{
  "token": "string"
}
```

#### 离开房间
```
POST /rooms/:roomId/leave
Content-Type: application/json

{
  "token": "string"
}
```

#### 获取房间消息
```
GET /rooms/:roomId/messages?limit=50
```

#### 获取房间用户
```
GET /rooms/:roomId/users
```

## WebSocket协议

### 连接地址
```
ws://localhost:3001
```

### 消息格式

#### 认证
```json
{
  "type": "auth",
  "token": "JWT_TOKEN"
}
```

#### 加入房间
```json
{
  "type": "join_room",
  "roomId": "ROOM_ID"
}
```

#### 离开房间
```json
{
  "type": "leave_room"
}
```

#### 发送消息
```json
{
  "type": "message",
  "content": "Hello World!"
}
```

#### 心跳检测
```json
{
  "type": "ping"
}
```

### 服务端响应

#### 认证成功
```json
{
  "type": "auth_success",
  "userId": 1,
  "username": "user1"
}
```

#### 加入房间成功
```json
{
  "type": "join_success",
  "roomId": "ROOM_ID",
  "roomName": "聊天室",
  "history": []
}
```

#### 用户加入通知
```json
{
  "type": "user_joined",
  "roomId": "ROOM_ID",
  "userId": 1,
  "username": "user1"
}
```

#### 用户离开通知
```json
{
  "type": "user_left",
  "roomId": "ROOM_ID",
  "userId": 1,
  "username": "user1"
}
```

#### 房间消息
```json
{
  "type": "message",
  "roomId": "ROOM_ID",
  "userId": 1,
  "username": "user1",
  "content": "Hello World!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 房间用户列表
```json
{
  "type": "room_users",
  "roomId": "ROOM_ID",
  "users": []
}
```

#### 心跳响应
```json
{
  "type": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 配置说明

配置文件位于 `src/config/index.ts`：

```typescript
{
  server: {
    httpPort: 3000,
    wsPort: 3001,
    host: '0.0.0.0'
  },
  jwt: {
    secret: 'your-secret-key-change-in-production',
    expiresIn: '7d'
  },
  bcrypt: {
    saltRounds: 10
  },
  database: {
    path: './chatroom.db'
  }
}
```

### 环境变量

可以通过环境变量覆盖配置：
- `JWT_SECRET` - JWT密钥

## 数据库结构

### users表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| password | TEXT | 加密后的密码 |
| created_at | DATETIME | 创建时间 |

### rooms表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键，UUID |
| name | TEXT | 房间名称 |
| description | TEXT | 房间描述 |
| created_at | DATETIME | 创建时间 |
| created_by | INTEGER | 创建者ID |

### room_users表
| 字段 | 类型 | 说明 |
|------|------|------|
| room_id | TEXT | 房间ID |
| user_id | INTEGER | 用户ID |
| joined_at | DATETIME | 加入时间 |

### messages表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| room_id | TEXT | 房间ID |
| user_id | INTEGER | 用户ID |
| username | TEXT | 用户名 |
| content | TEXT | 消息内容 |
| created_at | DATETIME | 创建时间 |

## 使用流程

1. **注册用户**
   ```bash
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"username": "user1", "password": "123456"}'
   ```

2. **登录获取token**
   ```bash
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"username": "user1", "password": "123456"}'
   ```

3. **创建房间**
   ```bash
   curl -X POST http://localhost:3000/rooms \
     -H "Content-Type: application/json" \
     -d '{"name": "聊天室", "token": "YOUR_TOKEN"}'
   ```

4. **WebSocket连接**
   ```javascript
   const ws = new WebSocket('ws://localhost:3001');
   
   ws.onopen = () => {
     // 认证
     ws.send(JSON.stringify({ type: 'auth', token: 'YOUR_TOKEN' }));
   };
   
   ws.onmessage = (event) => {
     const message = JSON.parse(event.data);
     console.log(message);
   };
   ```

## 许可证

MIT License
