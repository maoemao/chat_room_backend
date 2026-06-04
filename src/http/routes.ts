import { FastifyInstance } from 'fastify';
import { register, login, verifyToken } from '../services/authService';
import {
  createRoom,
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  getRoomUsers,
  getRoomMessages
} from '../services/roomService';

const registerSchema = {
  description: '用户注册',
  tags: ['认证'],
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', minLength: 3, description: '用户名' },
      password: { type: 'string', minLength: 6, description: '密码' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        token: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const loginSchema = {
  description: '用户登录',
  tags: ['认证'],
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', description: '用户名' },
      password: { type: 'string', description: '密码' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        token: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const getAllRoomsSchema = {
  description: '获取所有房间',
  tags: ['房间'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        rooms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string' },
              created_by: { type: 'number' },
              user_count: { type: 'number' }
            }
          }
        }
      }
    }
  }
};

const createRoomSchema = {
  description: '创建房间',
  tags: ['房间'],
  body: {
    type: 'object',
    required: ['name', 'token'],
    properties: {
      name: { type: 'string', description: '房间名称' },
      description: { type: 'string', description: '房间描述' },
      token: { type: 'string', description: '用户token' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        roomId: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const getRoomSchema = {
  description: '获取房间详情',
  tags: ['房间'],
  params: {
    type: 'object',
    required: ['roomId'],
    properties: {
      roomId: { type: 'string', description: '房间ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string' },
            created_by: { type: 'number' },
            user_count: { type: 'number' }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const joinRoomSchema = {
  description: '加入房间',
  tags: ['房间'],
  params: {
    type: 'object',
    required: ['roomId'],
    properties: {
      roomId: { type: 'string', description: '房间ID' }
    }
  },
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', description: '用户token' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        roomId: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const leaveRoomSchema = {
  description: '离开房间',
  tags: ['房间'],
  params: {
    type: 'object',
    required: ['roomId'],
    properties: {
      roomId: { type: 'string', description: '房间ID' }
    }
  },
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', description: '用户token' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        roomId: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const getMessagesSchema = {
  description: '获取房间历史消息',
  tags: ['房间'],
  params: {
    type: 'object',
    required: ['roomId'],
    properties: {
      roomId: { type: 'string', description: '房间ID' }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 50, description: '消息数量限制' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              room_id: { type: 'string' },
              user_id: { type: 'number' },
              username: { type: 'string' },
              content: { type: 'string' },
              created_at: { type: 'string' }
            }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

const getUsersSchema = {
  description: '获取房间用户列表',
  tags: ['房间'],
  params: {
    type: 'object',
    required: ['roomId'],
    properties: {
      roomId: { type: 'string', description: '房间ID' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              username: { type: 'string' },
              joined_at: { type: 'string' }
            }
          }
        }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' }
      }
    }
  }
};

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { schema: registerSchema }, async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    const result = await register(username || '', password || '');
    if (!result.success) {
      return reply.status(400).send(result);
    }
    return reply.send(result);
  });

  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string };
    const result = await login(username || '', password || '');
    if (!result.success) {
      return reply.status(401).send(result);
    }
    return reply.send(result);
  });
}

export async function roomRoutes(fastify: FastifyInstance) {
  fastify.get('/rooms', { schema: getAllRoomsSchema }, async (request, reply) => {
    const rooms = await getAllRooms();
    return reply.send({ success: true, rooms });
  });

  fastify.post('/rooms', { schema: createRoomSchema }, async (request, reply) => {
    const { name, description, token } = request.body as { name?: string; description?: string; token?: string };

    const authResult = verifyToken(token || '');
    if (!authResult.valid) {
      return reply.status(401).send({ success: false, error: 'Invalid token' });
    }

    const result = await createRoom(name || '', description || '', authResult.userId!);
    if (!result.success) {
      return reply.status(400).send(result);
    }
    return reply.send(result);
  });

  fastify.get('/rooms/:roomId', { schema: getRoomSchema }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const room = await getRoomById(roomId);
    if (!room) {
      return reply.status(404).send({ success: false, error: 'Room not found' });
    }
    return reply.send({ success: true, room });
  });

  fastify.post('/rooms/:roomId/join', { schema: joinRoomSchema }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const { token } = request.body as { token?: string };

    const authResult = verifyToken(token || '');
    if (!authResult.valid) {
      return reply.status(401).send({ success: false, error: 'Invalid token' });
    }

    const result = await joinRoom(roomId, authResult.userId!);
    if (!result.success) {
      return reply.status(400).send(result);
    }
    return reply.send(result);
  });

  fastify.post('/rooms/:roomId/leave', { schema: leaveRoomSchema }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const { token } = request.body as { token?: string };

    const authResult = verifyToken(token || '');
    if (!authResult.valid) {
      return reply.status(401).send({ success: false, error: 'Invalid token' });
    }

    const result = await leaveRoom(roomId, authResult.userId!);
    if (!result.success) {
      return reply.status(400).send(result);
    }
    return reply.send(result);
  });

  fastify.get('/rooms/:roomId/messages', { schema: getMessagesSchema }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const limit = Number((request.query as { limit?: string }).limit) || 50;

    const room = await getRoomById(roomId);
    if (!room) {
      return reply.status(404).send({ success: false, error: 'Room not found' });
    }

    const messages = await getRoomMessages(roomId, limit);
    return reply.send({ success: true, messages });
  });

  fastify.get('/rooms/:roomId/users', { schema: getUsersSchema }, async (request, reply) => {
    const { roomId } = request.params as { roomId: string };

    const room = await getRoomById(roomId);
    if (!room) {
      return reply.status(404).send({ success: false, error: 'Room not found' });
    }

    const users = await getRoomUsers(roomId);
    return reply.send({ success: true, users });
  });
}