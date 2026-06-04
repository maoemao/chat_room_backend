import Fastify from 'fastify';
import http from 'http';
import { config } from './config';
import { initDatabase } from './db';
import { authRoutes, roomRoutes } from './http/routes';
import { initWebSocket } from './ws';

const fastify = Fastify();
const server = http.createServer();

const start = async () => {
  try {
    await initDatabase();
    console.log('Database initialized');

    await fastify.register(require('@fastify/swagger'), {
      openapi: {
        info: {
          title: '聊天室后端API',
          description: '基于Fastify、WebSocket和SQLite的聊天室后端服务',
          version: '1.0.0'
        },
        servers: [
          {
            url: `http://${config.server.host}:${config.server.httpPort}`,
            description: '开发服务器'
          }
        ],
        tags: [
          { name: '认证', description: '用户认证相关接口' },
          { name: '房间', description: '房间管理相关接口' }
        ],
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                username: { type: 'string' },
                created_at: { type: 'string' }
              }
            },
            Room: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                created_at: { type: 'string' },
                created_by: { type: 'number' },
                user_count: { type: 'number' }
              }
            },
            Message: {
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
      }
    });

    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      },
      staticCSP: true,
      transformStaticCSP: (header: any) => header,
      transformSpecification: (swaggerObject: any, request: any, reply: any) => { return swaggerObject },
      transformSpecificationClone: true
    });

    await authRoutes(fastify);
    await roomRoutes(fastify);
    console.log('Routes registered');

    initWebSocket(server);
    console.log('WebSocket server initialized');

    await fastify.listen({ port: config.server.httpPort, host: config.server.host });
    server.listen(config.server.wsPort, config.server.host);

    console.log(`HTTP server running on http://${config.server.host}:${config.server.httpPort}`);
    console.log(`WebSocket server running on ws://${config.server.host}:${config.server.wsPort}`);
    console.log(`API documentation available at http://${config.server.host}:${config.server.httpPort}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();